import { createAuthNonce, isValidAccountId } from "@/lib/auth";
import { apiError, apiSuccess, requestId, zodDetails } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ accountId: z.string().trim().min(2).max(64) }).strict();

export async function POST(request: Request) {
  const id = requestId(request);
  const ip = clientIp(request);

  if (!rateLimit(`nonce:${ip}`, 20, 60_000)) {
    return apiError("RATE_LIMITED", "Too many sign-in attempts. Try again shortly.", 429, undefined, id);
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

  if (!isValidAccountId(parsed.data.accountId)) {
    return apiError("VALIDATION_ERROR", "Invalid NEAR account ID.", 400, undefined, id);
  }

  try {
    const challenge = await createAuthNonce(parsed.data.accountId);
    return apiSuccess(challenge, 201, id);
  } catch {
    return apiError("INTERNAL_ERROR", "Could not create a sign-in challenge.", 500, undefined, id);
  }
}
