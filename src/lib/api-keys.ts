import "server-only";

import { and, eq, isNull, or, gt } from "drizzle-orm";
import { createHmac, randomBytes } from "node:crypto";

import { getDb } from "@/db";
import { clientApiKeys, workspaces } from "@/db/schema";

export const API_KEY_PREFIX = "ds_test_";

export const CLIENT_SCOPES = [
  "audit:create",
  "audit:read:own",
  "audit:commit",
  "audit:fund",
  "certificate:read:own",
] as const;

export type ClientScope = (typeof CLIENT_SCOPES)[number];

export function generateApiKey(): string {
  return `${API_KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
}

export function hashApiKey(key: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return createHmac("sha256", secret).update(key).digest("hex");
}

export type ApiPrincipal = {
  keyId: string;
  workspaceId: string;
  workspaceName: string;
  clientAccountId: string;
  scopes: string[];
};

export async function authenticateApiKey(request: Request): Promise<ApiPrincipal | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const key = header.slice("Bearer ".length).trim();
  if (!key.startsWith(API_KEY_PREFIX) || key.length < 20) return null;

  const [row] = await getDb()
    .select({
      keyId: clientApiKeys.id,
      workspaceId: clientApiKeys.workspaceId,
      workspaceName: workspaces.name,
      clientAccountId: workspaces.clientAccountId,
      scopes: clientApiKeys.scopes,
      expiresAt: clientApiKeys.expiresAt,
      workspaceStatus: workspaces.status,
    })
    .from(clientApiKeys)
    .innerJoin(workspaces, eq(workspaces.id, clientApiKeys.workspaceId))
    .where(
      and(
        eq(clientApiKeys.keyHash, hashApiKey(key)),
        eq(clientApiKeys.status, "ACTIVE"),
        eq(workspaces.status, "ACTIVE"),
        or(isNull(clientApiKeys.expiresAt), gt(clientApiKeys.expiresAt, new Date())),
      ),
    )
    .limit(1);

  if (!row) return null;

  void getDb()
    .update(clientApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(clientApiKeys.id, row.keyId))
    .catch(() => undefined);

  return {
    keyId: row.keyId,
    workspaceId: row.workspaceId,
    workspaceName: row.workspaceName,
    clientAccountId: row.clientAccountId ?? process.env.DEMO_CLIENT_ACCOUNT_ID ?? "demo-client.testnet",
    scopes: row.scopes,
  };
}

export function hasScope(principal: ApiPrincipal, scope: ClientScope): boolean {
  return principal.scopes.includes(scope);
}
