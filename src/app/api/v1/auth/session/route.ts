import { getWalletSession } from "@/lib/auth";
import { getAdminAllowlist } from "@/lib/env";
import { apiSuccess, requestId } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = requestId(request);
  const session = await getWalletSession();
  if (!session) {
    return apiSuccess({ authenticated: false }, 200, id);
  }
  return apiSuccess(
    {
      authenticated: true,
      accountId: session.accountId,
      isAdmin: getAdminAllowlist().includes(session.accountId),
      expiresAt: session.expiresAt.toISOString(),
    },
    200,
    id,
  );
}
