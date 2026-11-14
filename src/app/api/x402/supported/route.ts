import { x402ShimCapabilities } from "@/lib/x402/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    return Response.json(await x402ShimCapabilities(), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      {
        error: "X402_SHIM_NOT_CONFIGURED",
        message: error instanceof Error ? error.message : "unknown",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
