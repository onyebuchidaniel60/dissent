import { handlePaidInference } from "@/lib/x402/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  return handlePaidInference(request, "openrouter");
}
