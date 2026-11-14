import "server-only";

import { CLIENT_SCOPES, authenticateApiKey, hasScope, type ApiPrincipal } from "@/lib/api-keys";
import { getWalletSession } from "@/lib/auth";
import { ensureWorkspaceForAccount } from "@/lib/workspace";

export type AuditPrincipalResult =
  | { principal: ApiPrincipal }
  | { status: 401 | 403; message: string };

/**
 * Accept either the machine API key or the signed wallet session. API-key
 * requests keep their original scope checks; session requests are scoped to the
 * authenticated wallet's active workspace.
 */
export async function resolveAuditPrincipal(
  request: Request,
  scope: (typeof CLIENT_SCOPES)[number],
): Promise<AuditPrincipalResult> {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const principal = await authenticateApiKey(request);
    if (!principal) {
      return { status: 401, message: "A valid client API key is required." };
    }
    if (!hasScope(principal, scope)) {
      return { status: 403, message: `This key does not have ${scope}.` };
    }
    return { principal };
  }

  const session = await getWalletSession();
  if (!session) {
    return { status: 401, message: "Connect a NEAR wallet session first." };
  }

  const workspace = await ensureWorkspaceForAccount(session.accountId);
  return {
    principal: {
      keyId: `wallet:${session.sessionId}`,
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.workspaceName,
      clientAccountId: workspace.clientAccountId ?? session.accountId,
      scopes: [...CLIENT_SCOPES],
    },
  };
}
