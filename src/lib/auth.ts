import "server-only";

import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { JsonRpcProvider } from "near-api-js";
import { verifyMessage } from "near-api-js/nep413";
import { createHmac, randomBytes, randomUUID } from "node:crypto";

import { getDb } from "@/db";
import { authNonces, walletSessions } from "@/db/schema";
import { PREVIEW_AUTH_RECIPIENT } from "@/lib/config";
import { getAdminAllowlist, getAppBaseUrl } from "@/lib/env";
import { NEAR_NETWORK, NEAR_RPC_URL } from "@/lib/network";
import { ensureWorkspaceForAccount } from "@/lib/workspace";

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
  const appBase = getAppBaseUrl().replace(/\/+$/, "");
  // The live preview must use the exact public origin, regardless of a stale
  // Render AUTH_RECIPIENT value.
  if (
    appBase === PREVIEW_AUTH_RECIPIENT ||
    (process.env.NODE_ENV === "production" && NEAR_NETWORK === "testnet")
  ) {
    return PREVIEW_AUTH_RECIPIENT;
  }
  return (process.env.AUTH_RECIPIENT?.trim() || appBase || PREVIEW_AUTH_RECIPIENT).replace(
    /\/+$/,
    "",
  );
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

function rpcUrlForAccount(accountId: string): string {
  const normalized = accountId.toLowerCase();
  if (/^[0-9a-f]{64}$/i.test(normalized)) {
    return NEAR_NETWORK === "testnet"
      ? "https://rpc.testnet.fastnear.com"
      : "https://rpc.mainnet.fastnear.com";
  }
  if (normalized.endsWith(".testnet")) return "https://rpc.testnet.fastnear.com";
  if (normalized.endsWith(".near")) return "https://rpc.mainnet.fastnear.com";
  return NEAR_RPC_URL;
}

type RawAccessKey = {
  permission?: "FullAccess" | { FunctionCall?: unknown } | string;
};

const ACCESS_KEY_CACHE_TTL_MS = 60_000;
const accessKeyCache = new Map<string, { raw: RawAccessKey; expiresAt: number }>();

async function viewAccessKeyRaw(
  rpcUrl: string,
  accountId: string,
  publicKey: string,
): Promise<{ ok: true; raw: RawAccessKey } | { ok: false }> {
  const cacheKey = `${rpcUrl}|${accountId}|${publicKey}`;
  const cached = accessKeyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(
      "[auth/verify] view_access_key_cached",
      JSON.stringify({ rpcUrl, accountId, publicKey, response: cached.raw }),
    );
    return { ok: true, raw: cached.raw };
  }

  const provider = new JsonRpcProvider({ url: rpcUrl });
  try {
    const raw = (await provider.sendJsonRpc("query", {
      request_type: "view_access_key",
      finality: "final",
      account_id: accountId,
      public_key: publicKey,
    })) as RawAccessKey;
    accessKeyCache.set(cacheKey, { raw, expiresAt: Date.now() + ACCESS_KEY_CACHE_TTL_MS });
    console.log(
      "[auth/verify] view_access_key",
      JSON.stringify({ rpcUrl, accountId, publicKey, response: raw }),
    );
    return { ok: true, raw };
  } catch (error) {
    console.log(
      "[auth/verify] view_access_key_failed",
      JSON.stringify({
        rpcUrl,
        accountId,
        publicKey,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { ok: false };
  }
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
  recipient?: string;
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
  const expectedRecipient = challenge.recipient.replace(/\/+$/, "");
  const suppliedRecipient = input.recipient?.trim().replace(/\/+$/, "");

  console.log(
    "[auth/verify] request",
    JSON.stringify({
      accountId: input.accountId,
      publicKey,
      expectedRecipient,
      suppliedRecipient: suppliedRecipient ?? null,
      appBaseUrl: getAppBaseUrl(),
      network: NEAR_NETWORK,
    }),
  );
  console.log(
    "[auth/verify] signature",
    JSON.stringify({
      raw: input.signature,
      prefix: input.signature.match(/^[a-z0-9-]+:/i)?.[0] ?? null,
      length: input.signature.length,
      decodedLength: signature.length,
      message: challenge.message,
      nonce: input.nonce,
      recipient: expectedRecipient,
      callbackUrl: challenge.callbackUrl,
    }),
  );

  if (suppliedRecipient && suppliedRecipient !== expectedRecipient) {
    throw new Error("RECIPIENT_MISMATCH");
  }

  const primaryRpc = rpcUrlForAccount(input.accountId);
  const fallbackRpc = primaryRpc.includes("testnet")
    ? "https://rpc.mainnet.fastnear.com"
    : "https://rpc.testnet.fastnear.com";

  const primary = await viewAccessKeyRaw(primaryRpc, input.accountId, publicKey);
  if (!primary.ok) {
    const fallback = await viewAccessKeyRaw(fallbackRpc, input.accountId, publicKey);
    if (fallback.ok) {
      console.warn(
        "[auth/verify] wrong_network",
        JSON.stringify({
          accountId: input.accountId,
          publicKey,
          primaryRpc,
          fallbackRpc,
          warning: "The access key exists on the other NEAR network.",
        }),
      );
      throw new Error("WRONG_NETWORK");
    }
    throw new Error("ACCESS_KEY_NOT_FOUND");
  }

  const permission = primary.raw.permission;
  if (permission && typeof permission === "object" && "FunctionCall" in permission) {
    console.warn(
      "[auth/verify] function_call_key",
      JSON.stringify({ accountId: input.accountId, publicKey, rpcUrl: primaryRpc }),
    );
    throw new Error("FUNCTION_CALL_KEY");
  }
  if (permission !== "FullAccess") throw new Error("UNSUPPORTED_KEY_PERMISSION");

  const provider = new JsonRpcProvider({ url: primaryRpc });
  const basePayload = {
    message: challenge.message,
    recipient: expectedRecipient,
    nonce: nonceBytes,
  };
  const variants: Array<{
    label: string;
    payload: typeof basePayload & { callbackUrl?: string };
  }> = [
    ...(challenge.callbackUrl
      ? [{ label: "callbackUrl", payload: { ...basePayload, callbackUrl: challenge.callbackUrl } }]
      : []),
    { label: "no_callbackUrl", payload: basePayload },
  ];
  const attempts: Array<{ variant: string; error: string }> = [];
  let verifiedWith: string | null = null;

  for (const variant of variants) {
    try {
      await verifyMessage({
        signerAccountId: input.accountId,
        signerPublicKey: publicKey,
        payload: variant.payload,
        signature,
        provider,
      });
      verifiedWith = variant.label;
      break;
    } catch (error) {
      attempts.push({
        variant: variant.label,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(
    "[auth/verify] signature_check",
    JSON.stringify({
      accountId: input.accountId,
      publicKey,
      verifiedWith,
      attempts,
      recipient: expectedRecipient,
      callbackUrl: challenge.callbackUrl,
      nonce: input.nonce,
      message: challenge.message,
    }),
  );

  if (!verifiedWith) throw new Error("SIGNATURE_MISMATCH");

  const claimed = await db
    .update(authNonces)
    .set({ usedAt: new Date() })
    .where(and(eq(authNonces.id, challenge.id), isNull(authNonces.usedAt)))
    .returning({ id: authNonces.id });

  if (claimed.length !== 1) throw new Error("NONCE_EXPIRED_OR_USED");

  const session = await createWalletSession(input.accountId, nonceHash);
  try {
    await ensureWorkspaceForAccount(input.accountId);
  } catch (error) {
    console.error(
      "[auth/workspace] provision_failed",
      JSON.stringify({
        accountId: input.accountId,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
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
