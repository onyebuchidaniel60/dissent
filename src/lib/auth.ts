import "server-only";

import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { JsonRpcProvider } from "near-api-js";
import { verifyMessage } from "near-api-js/nep413";
import { createHmac, randomBytes, randomUUID } from "node:crypto";

import { getDb } from "@/db";
import { authNonces, walletSessions } from "@/db/schema";
import { getAdminAllowlist, getAppBaseUrl } from "@/lib/env";

export const SESSION_COOKIE = "dissent_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const NONCE_TTL_SECONDS = 5 * 60;

export function hashSecret(value: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isValidAccountId(accountId: string): boolean {
  if (accountId.length < 2 || accountId.length > 64) return false;
  return /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/.test(accountId);
}

export function authRecipient(): string {
  return process.env.AUTH_RECIPIENT?.trim() || getAppBaseUrl();
}

function normalizePublicKey(publicKey: string): string {
  const trimmed = publicKey.trim();
  return /^(ed25519|secp256k1|ml-dsa-65):/i.test(trimmed) ? trimmed : `ed25519:${trimmed}`;
}

/**
 * Wallets return the NEP-413 signature as a base64 string. Some injected
 * wallets return base64url, a JSON byte array, or an already-prefixed value.
 * Normalize all of those to the raw bytes expected by near-api-js.
 */
function decodeNep413Signature(signature: string): Uint8Array {
  const trimmed = signature.trim().replace(/^ed25519:/i, "");
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const bytes = JSON.parse(trimmed) as unknown;
      if (Array.isArray(bytes) && bytes.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)) {
        return new Uint8Array(bytes);
      }
    } catch {
      // Fall through to the base64 decoder.
    }
  }
  if (/^[0-9a-f]{128}$/i.test(trimmed)) {
    return new Uint8Array(Buffer.from(trimmed, "hex"));
  }
  const normalized = trimmed.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Buffer.from(normalized, "base64");
  if (bytes.length !== 64) throw new Error("INVALID_SIGNATURE_ENCODING");
  return new Uint8Array(bytes);
}

export function buildAuthMessage(accountId: string, nonce: string): string {
  return [
    "Dissent wallet sign-in",
    "",
    `Account: ${accountId}`,
    `Nonce: ${nonce}`,
    `Issued: ${new Date().toISOString()}`,
    "",
    "This signature proves account control. It does not authorize a transaction or a transfer.",
  ].join("\n");
}

export async function createAuthNonce(accountId: string): Promise<{
  nonce: string;
  message: string;
  recipient: string;
  callbackUrl: string;
  expiresAt: string;
}> {
  if (!isValidAccountId(accountId)) throw new Error("INVALID_ACCOUNT_ID");

  const nonce = randomBytes(32).toString("base64");
  const message = buildAuthMessage(accountId, nonce);
  const recipient = authRecipient();
  const callbackUrl = getAppBaseUrl();
  const expiresAt = new Date(Date.now() + NONCE_TTL_SECONDS * 1000);

  await getDb().insert(authNonces).values({
    accountId,
    nonceHash: hashSecret(nonce),
    message,
    recipient,
    callbackUrl,
    expiresAt,
  });

  return {
    nonce,
    message,
    recipient,
    callbackUrl,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function verifyWalletSignature(input: {
  accountId: string;
  publicKey: string;
  signature: string;
  nonce: string;
}): Promise<{
  accountId: string;
  isAdmin: boolean;
  sessionToken: string;
  sessionId: string;
  expiresAt: Date;
}> {
  if (!isValidAccountId(input.accountId)) throw new Error("INVALID_ACCOUNT_ID");

  const db = getDb();
  const nonceHash = hashSecret(input.nonce);
  const [challenge] = await db
    .select()
    .from(authNonces)
    .where(
      and(
        eq(authNonces.accountId, input.accountId),
        eq(authNonces.nonceHash, nonceHash),
        isNull(authNonces.usedAt),
        gt(authNonces.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!challenge) throw new Error("NONCE_EXPIRED_OR_USED");

  const nonceBytes = Buffer.from(input.nonce, "base64");
  const publicKey = normalizePublicKey(input.publicKey);
  const signature = decodeNep413Signature(input.signature);
  const provider = new JsonRpcProvider({
    url: process.env.NEAR_RPC_URL ?? "https://rpc.mainnet.near.org",
  });

  try {
    const accessKey = await provider.viewAccessKey({
      accountId: input.accountId,
      publicKey,
    });
    if (accessKey.permission !== "FullAccess") {
      throw new Error("FULL_ACCESS_KEY_REQUIRED");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "FULL_ACCESS_KEY_REQUIRED") throw error;
    throw new Error("ACCESS_KEY_NOT_FOUND");
  }

  try {
    await verifyMessage({
      signerAccountId: input.accountId,
      signerPublicKey: publicKey,
      payload: {
        message: challenge.message,
        recipient: challenge.recipient,
        nonce: nonceBytes,
        callbackUrl: challenge.callbackUrl ?? undefined,
      },
      signature,
      provider,
    });
  } catch {
    throw new Error("SIGNATURE_MISMATCH");
  }

  const claimed = await db
    .update(authNonces)
    .set({ usedAt: new Date() })
    .where(and(eq(authNonces.id, challenge.id), isNull(authNonces.usedAt)))
    .returning({ id: authNonces.id });

  if (claimed.length !== 1) throw new Error("NONCE_EXPIRED_OR_USED");

  const session = await createWalletSession(input.accountId, nonceHash);
  return {
    ...session,
    isAdmin: getAdminAllowlist().includes(input.accountId),
  };
}

export async function createWalletSession(
  accountId: string,
  nonceHash: string,
): Promise<{ accountId: string; sessionToken: string; sessionId: string; expiresAt: Date }> {
  const token = generateToken();
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await getDb().insert(walletSessions).values({
    sessionId,
    accountId,
    sessionHash: hashSecret(token),
    nonceHash,
    expiresAt,
  });

  return { accountId, sessionToken: token, sessionId, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}

export async function getWalletSession(): Promise<{
  id: string;
  sessionId: string;
  accountId: string;
  expiresAt: Date;
} | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const [session] = await getDb()
      .select({
        id: walletSessions.id,
        sessionId: walletSessions.sessionId,
        accountId: walletSessions.accountId,
        expiresAt: walletSessions.expiresAt,
      })
      .from(walletSessions)
      .where(
        and(
          eq(walletSessions.sessionHash, hashSecret(token)),
          eq(walletSessions.status, "ACTIVE"),
          gt(walletSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return session ?? null;
  } catch {
    return null;
  }
}

export async function revokeWalletSession(): Promise<void> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return;
    await getDb()
      .update(walletSessions)
      .set({ status: "REVOKED", revokedAt: new Date() })
      .where(eq(walletSessions.sessionHash, hashSecret(token)));
  } catch {
    // Logout must still clear the cookie even if the database is unavailable.
  }
}

export async function getAdminSession() {
  const session = await getWalletSession();
  if (!session) return null;
  return getAdminAllowlist().includes(session.accountId) ? session : null;
}
