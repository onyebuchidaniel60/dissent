import {
  setSessionCookie,
  verifyWalletSignature,
} from "@/lib/auth";
import { apiError, apiSuccess, requestId, zodDetails } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    accountId: z.string().trim().min(2).max(64),
    publicKey: z.string().trim().min(10).max(200),
    signature: z.string().trim().min(10).max(500),
    nonce: z.string().trim().min(10).max(200),
  })
  .strict();

export async function POST(request: Request) {
  const id = requestId(request);
  const ip = clientIp(request);

  if (!rateLimit(`verify:${ip}`, 20, 60_000)) {
    return apiError("RATE_LIMITED", "Too many verification attempts. Try again shortly.", 429, undefined, id);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Request body must be valid JSON.", 400, undefined, id);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "One or more fields are invalid.", 400, zodDetails(parsed.error), id);
  }

  try {
    const result = await verifyWalletSignature(parsed.data);
    await setSessionCookie(result.sessionToken, result.expiresAt);
    return apiSuccess(
      {
        authenticated: true,
        accountId: result.accountId,
        isAdmin: result.isAdmin,
      },
      200,
      id,
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "NONCE_EXPIRED_OR_USED") {
      return apiError("UNAUTHENTICATED", "The sign-in challenge expired or was already used.", 401, undefined, id);
    }
    if (code === "INVALID_SIGNATURE_OR_ACCESS_KEY") {
      return apiError("UNAUTHENTICATED", "The wallet signature could not be verified.", 401, undefined, id);
    }
    return apiError("UNAUTHENTICATED", "Wallet verification failed.", 401, undefined, id);
  }
}
