import { clearSessionCookie, revokeWalletSession } from "@/lib/auth";
import { apiError, apiSuccess, requestId } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const id = requestId(request);
  const origin = request.headers.get("origin");
  const expected = process.env.APP_BASE_URL;
  if (origin && expected && origin !== expected) {
    return apiError("FORBIDDEN", "Cross-origin logout is not allowed.", 403, undefined, id);
  }

  await revokeWalletSession();
  await clearSessionCookie();
  return apiSuccess({ authenticated: false }, 200, id);
}
