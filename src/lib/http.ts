import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "COMMITMENT_NOT_FINAL"
  | "FUNDING_REQUIRED"
  | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "INTERNAL_ERROR";

export function requestId(request?: Request): string {
  return request?.headers.get("x-request-id")?.slice(0, 128) || (randomUUID() as string);
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown,
  id: string = randomUUID(),
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        request_id: id,
        ...(details ? { details } : {}),
      },
    },
    { status, headers: { "x-request-id": id, "cache-control": "no-store" } },
  );
}

export function apiSuccess(data: unknown, status = 200, id: string = randomUUID()) {
  return NextResponse.json(
    { ...(data as Record<string, unknown>), request_id: id },
    { status, headers: { "x-request-id": id, "cache-control": "no-store" } },
  );
}

export function zodDetails(error: {
  issues: Array<{ path: PropertyKey[]; message: string; code?: string }>;
}) {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    code: issue.code ?? "INVALID",
    message: issue.message,
  }));
}
