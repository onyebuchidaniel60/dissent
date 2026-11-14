import "server-only";

import { createNearFacilitator } from "@fastnear/x402/facilitator";
import { createNearResourceServer } from "@fastnear/x402/server";
import {
  x402HTTPResourceServer,
  type HTTPAdapter,
  type HTTPProcessResult,
  type HTTPRequestContext,
  type HTTPResponseInstructions,
  type PaymentOption,
  type RoutesConfig,
} from "@x402/core/http";

import { MODEL_ASSIGNMENTS } from "@/lib/model-assignments";
import { NEAR_NETWORK } from "@/lib/network";

export type X402Provider = "openrouter" | "groq";

export const X402_ROUTES: Record<X402Provider, string> = {
  openrouter: "/api/x402/openrouter/chat/completions",
  groq: "/api/x402/groq/chat/completions",
};

const PROVIDERS: Record<X402Provider, { baseUrl: string; credentialEnv: string; label: string }> = {
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    credentialEnv: "OPENROUTER_API_KEY",
    label: "openrouter",
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    credentialEnv: "GROQ_API_KEY",
    label: "groq",
  },
};

const MAX_BODY_BYTES = 96 * 1024;
const DEFAULT_MAX_OUTPUT_TOKENS = 4_096;
const REQUEST_TIMEOUT_MS = 120_000;

type ShimState = {
  httpServer: x402HTTPResourceServer;
  facilitator: ReturnType<typeof createNearFacilitator>;
  network: string;
  asset: string;
  payTo: string;
  priceAtomic: string;
  rpcUrl: string;
};

let statePromise: Promise<ShimState> | null = null;

/**
 * The facilitator relayer signs one outer transaction per settlement. Serialise
 * settlements so two paid calls cannot race the relayer access-key nonce.
 */
let settlementQueue: Promise<unknown> = Promise.resolve();

function withSettlementLock<T>(fn: () => Promise<T>): Promise<T> {
  const pending = settlementQueue.then(fn, fn);
  settlementQueue = pending.then(
    () => undefined,
    () => undefined,
  );
  return pending;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`X402_SHIM_MISSING_ENV:${name}`);
  return value;
}

export function x402ShimEnabled(): boolean {
  return process.env.X402_SHIM_ENABLED === "true";
}

function defaultAsset(network: string): string {
  return network === "near:mainnet"
    ? "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1"
    : "usdc.tidepool-sandbox.testnet";
}

function allowedModels(): Set<string> {
  const configured = (process.env.X402_ALLOWED_MODELS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (configured.length > 0) return new Set(configured);
  return new Set(
    MODEL_ASSIGNMENTS.attackers.flatMap((attacker) => [attacker.model_id, ...attacker.fallbacks]),
  );
}

function adapterFor(request: Request): HTTPAdapter {
  const url = new URL(request.url);
  return {
    getHeader: (name: string) => request.headers.get(name) ?? undefined,
    getMethod: () => request.method,
    getPath: () => url.pathname,
    getUrl: () => url.toString(),
    getAcceptHeader: () => request.headers.get("accept") ?? "",
    getUserAgent: () => request.headers.get("user-agent") ?? "",
  };
}

function responseFromInstructions(instructions: HTTPResponseInstructions): Response {
  const headers = new Headers(instructions.headers);
  if (instructions.body === undefined) {
    return new Response(null, { status: instructions.status, headers });
  }
  const body =
    typeof instructions.body === "string" ? instructions.body : JSON.stringify(instructions.body);
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  return new Response(body, { status: instructions.status, headers });
}

async function shimState(): Promise<ShimState> {
  if (!statePromise) {
    statePromise = (async () => {
      const network = NEAR_NETWORK === "mainnet" ? "near:mainnet" : "near:testnet";
      const asset = process.env.X402_USDC_TOKEN_ID?.trim() || defaultAsset(network);
      const payTo = requiredEnv("X402_PAY_TO_ACCOUNT_ID");
      const priceAtomic = process.env.X402_PRICE_ATOMIC?.trim() || "2000";
      const relayerAccountId =
        process.env.X402_RELAYER_ACCOUNT_ID?.trim() || requiredEnv("NEAR_DEPLOYER_ACCOUNT_ID");
      const relayerKey = process.env.X402_RELAYER_KEY?.trim() || requiredEnv("NEAR_DEPLOYER_KEY");
      const rpcUrl =
        process.env.X402_RPC_URL?.trim() ||
        process.env.NEAR_RPC_URL?.trim() ||
        (network === "near:mainnet"
          ? "https://rpc.mainnet.fastnear.com"
          : "https://rpc.testnet.fastnear.com");

      const facilitator = createNearFacilitator({
        registrations: [
          {
            network,
            signer: {
              relayers: [
                {
                  accountId: relayerAccountId,
                  secretKey: relayerKey as `ed25519:${string}`,
                },
              ],
              rpcUrls: { [network]: rpcUrl },
            },
          },
        ],
      });

      const resourceServer = createNearResourceServer({ facilitators: facilitator });
      const accepts: PaymentOption = {
        scheme: "exact",
        network,
        price: { amount: priceAtomic, asset },
        payTo,
        maxTimeoutSeconds: 300,
      };
      const routes: RoutesConfig = {
        [`POST ${X402_ROUTES.openrouter}`]: {
          accepts,
          description: "Dissent OpenRouter inference via x402",
          mimeType: "application/json",
        },
        [`POST ${X402_ROUTES.groq}`]: {
          accepts,
          description: "Dissent Groq inference via x402",
          mimeType: "application/json",
        },
      };
      const httpServer = new x402HTTPResourceServer(resourceServer, routes);
      await httpServer.initialize();

      return { httpServer, facilitator, network, asset, payTo, priceAtomic, rpcUrl };
    })().catch((error: unknown) => {
      statePromise = null;
      throw error;
    });
  }
  return statePromise;
}

/**
 * Public capability document for the self-hosted x402 shim. No secrets: the
 * relayer account is already public on-chain and in the facilitator response.
 * The `relayerRpc` probe makes outbound-RPC failures visible without exposing
 * the underlying signer.
 */
export async function x402ShimCapabilities(): Promise<Record<string, unknown>> {
  const state = await shimState();
  return {
    enabled: x402ShimEnabled(),
    network: state.network,
    asset: state.asset,
    payTo: state.payTo,
    priceAtomic: state.priceAtomic,
    priceUsdc: (Number(state.priceAtomic) / 1_000_000).toFixed(6),
    routes: X402_ROUTES,
    supported: state.facilitator.getSupported(),
    upstreamFacilitator: process.env.X402_FACILITATOR_URL ?? null,
    relayerRpc: await probeRpc(state.rpcUrl),
  };
}

async function probeRpc(url: string): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "dissent-x402-probe",
        method: "block",
        params: { finality: "final" },
      }),
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
    });
    if (!response.ok) return { ok: false, error: `HTTP_${response.status}` };
    const data = (await response.json()) as {
      result?: { header?: { height?: number } };
      error?: { message?: string; cause?: { name?: string } };
    };
    if (data.error) {
      return { ok: false, error: data.error.cause?.name ?? data.error.message ?? "RPC_ERROR" };
    }
    return { ok: true, height: data.result?.header?.height ?? null };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? `${error.name}:${error.message}` : "RPC_UNREACHABLE",
    };
  }
}

function validateInferenceBody(
  body: unknown,
  provider: X402Provider,
): { model: string; maxTokens: number; raw: string } {
  if (!body || typeof body !== "object") throw new Error("INVALID_BODY");
  const record = body as Record<string, unknown>;
  const model = typeof record.model === "string" ? record.model : "";
  if (!model) throw new Error("MODEL_REQUIRED");
  if (provider === "openrouter" && /:online$/.test(model)) throw new Error("MODEL_NOT_ALLOWED");
  if (!allowedModels().has(model)) throw new Error("MODEL_NOT_ALLOWED");
  if (!Array.isArray(record.messages) || record.messages.length === 0) {
    throw new Error("MESSAGES_REQUIRED");
  }

  const configuredMax = Number(process.env.X402_MAX_OUTPUT_TOKENS ?? DEFAULT_MAX_OUTPUT_TOKENS);
  const requested = Number(record.max_tokens ?? configuredMax);
  const maxTokens = Math.min(
    Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : configuredMax,
    Number.isFinite(configuredMax) && configuredMax > 0 ? configuredMax : DEFAULT_MAX_OUTPUT_TOKENS,
  );
  const raw = JSON.stringify({ ...record, max_tokens: maxTokens });
  return { model, maxTokens, raw };
}

/**
 * Process one paid inference request. Unpaid requests receive the canonical
 * x402 402 challenge; paid requests are verified, forwarded with the existing
 * provider credential, settled on-chain, and returned with the settlement
 * header.
 */
export async function handlePaidInference(
  request: Request,
  provider: X402Provider,
): Promise<Response> {
  if (!x402ShimEnabled()) {
    return Response.json(
      { error: "X402_SHIM_DISABLED", message: "Paid inference is not enabled." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  if (request.method !== "POST") {
    return Response.json(
      { error: "METHOD_NOT_ALLOWED" },
      { status: 405, headers: { allow: "POST" } },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: "BODY_TOO_LARGE" }, { status: 413 });
  }

  let state: ShimState;
  try {
    state = await shimState();
  } catch (error) {
    console.error("[x402] shim configuration failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return Response.json({ error: "X402_SHIM_NOT_CONFIGURED" }, { status: 503 });
  }

  const url = new URL(request.url);
  const context: HTTPRequestContext = {
    adapter: adapterFor(request),
    path: url.pathname,
    method: request.method,
    paymentHeader:
      request.headers.get("payment-signature") ?? request.headers.get("x-payment") ?? undefined,
  };

  let result: HTTPProcessResult;
  try {
    result = await state.httpServer.processHTTPRequest(context);
  } catch (error) {
    console.error("[x402] challenge failed", {
      provider,
      message: error instanceof Error ? error.message : "unknown",
    });
    return Response.json({ error: "X402_CHALLENGE_FAILED" }, { status: 503 });
  }

  if (result.type === "payment-error") {
    if (context.paymentHeader) {
      let reason = "unknown";
      try {
        const header = result.response.headers["payment-required"];
        if (header) {
          const decoded = JSON.parse(Buffer.from(header, "base64").toString("utf8")) as {
            error?: string;
          };
          reason = decoded.error ?? reason;
        }
      } catch {
        // Keep the generic reason; never log payment material.
      }
      console.warn("[x402] payment rejected", { provider, reason });
    }
    return responseFromInstructions(result.response);
  }
  if (result.type !== "payment-verified") {
    return Response.json({ error: "X402_ROUTE_NOT_PAID" }, { status: 404 });
  }

  const bodyText = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return Response.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  let forwardBody: string;
  try {
    forwardBody = validateInferenceBody(parsed, provider).raw;
  } catch (error) {
    await result.cancellationDispatcher.cancel({
      reason: "handler_failed",
      responseStatus: 400,
    });
    return Response.json(
      { error: error instanceof Error ? error.message : "INVALID_REQUEST" },
      { status: 400 },
    );
  }

  const config = PROVIDERS[provider];
  const credential = process.env[config.credentialEnv]?.trim();
  if (!credential) {
    await result.cancellationDispatcher.cancel({
      reason: "handler_failed",
      responseStatus: 503,
    });
    return Response.json({ error: "PROVIDER_NOT_CONFIGURED" }, { status: 503 });
  }

  const upstream = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${credential}`,
      "content-type": "application/json",
      "user-agent": "Dissent/1.0 (x402 compute shim)",
      ...(provider === "openrouter"
        ? {
            "HTTP-Referer": process.env.APP_BASE_URL ?? "https://dissent-web.onrender.com",
            "X-Title": "Dissent adversarial audit",
          }
        : {}),
    },
    body: forwardBody,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    redirect: "error",
  }).catch(() => null);

  if (!upstream) {
    await result.cancellationDispatcher.cancel({
      reason: "handler_failed",
      responseStatus: 502,
    });
    return Response.json({ error: "PROVIDER_UNREACHABLE" }, { status: 502 });
  }

  const upstreamBody = await upstream.text();
  if (!upstream.ok) {
    await result.cancellationDispatcher.cancel({
      reason: "handler_failed",
      responseStatus: upstream.status,
    });
    return new Response(upstreamBody, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  }

  const settlement = await withSettlementLock(() =>
    state.httpServer.processSettlement(
      result.paymentPayload,
      result.paymentRequirements,
      result.declaredExtensions,
      { request: context, responseBody: Buffer.from(upstreamBody) },
    ),
  );
  if (!settlement.success) return responseFromInstructions(settlement.response);

  const headers = new Headers({
    "content-type": upstream.headers.get("content-type") ?? "application/json",
    "cache-control": "no-store",
  });
  for (const [name, value] of Object.entries(settlement.headers)) {
    headers.set(name, value);
  }
  return new Response(upstreamBody, { status: upstream.status, headers });
}
