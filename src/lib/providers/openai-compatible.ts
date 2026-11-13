import "server-only";

import { MODEL_ASSIGNMENTS, PROVIDER_CONFIG } from "@/lib/model-assignments";

export type ProviderName = "openrouter" | "groq";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ProviderCallInput = {
  attackerId: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  signal?: AbortSignal;
};

export type ProviderCallResult = {
  text: string;
  provider: ProviderName;
  modelId: string;
  assignedModelId: string;
  publicModelName: string;
  requestId: string | null;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  usedFallback: boolean;
  fallbackIndex: number;
};

export class ProviderError extends Error {
  code: "RATE_LIMITED" | "TIMEOUT" | "UNAVAILABLE" | "AUTH" | "INVALID_RESPONSE" | "BUDGET";

  constructor(code: ProviderError["code"], message: string) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
  }
}

type ProviderConfig = (typeof PROVIDER_CONFIG)[keyof typeof PROVIDER_CONFIG];

type Bucket = {
  day: string;
  requestsThisMinute: number;
  tokensThisMinute: number;
  requestsToday: number;
  tokensToday: number;
  minuteResetAt: number;
  dayResetAt: number;
};

const buckets = new Map<ProviderName, Bucket>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function bucketFor(provider: ProviderName): Bucket {
  const day = todayKey();
  const now = Date.now();
  const existing = buckets.get(provider);
  if (existing && existing.day === day && existing.dayResetAt > now) return existing;

  const next: Bucket = {
    day,
    requestsThisMinute: 0,
    tokensThisMinute: 0,
    requestsToday: 0,
    tokensToday: 0,
    minuteResetAt: now + 60_000,
    dayResetAt: new Date(`${day}T24:00:00.000Z`).getTime(),
  };
  buckets.set(provider, next);
  return next;
}

function acquire(provider: ProviderName, estimatedTokens: number): void {
  const config = PROVIDER_CONFIG[provider] as ProviderConfig;
  const bucket = bucketFor(provider);
  const now = Date.now();

  if (bucket.minuteResetAt <= now) {
    bucket.requestsThisMinute = 0;
    bucket.tokensThisMinute = 0;
    bucket.minuteResetAt = now + 60_000;
  }

  if (bucket.requestsThisMinute >= (config.rpm ?? 20)) {
    throw new ProviderError("RATE_LIMITED", `${provider} per-minute request limit reached`);
  }
  if ("tpm" in config && config.tpm && bucket.tokensThisMinute + estimatedTokens > config.tpm) {
    throw new ProviderError("RATE_LIMITED", `${provider} per-minute token limit reached`);
  }
  if ("rpd" in config && config.rpd && bucket.requestsToday >= config.rpd) {
    throw new ProviderError("RATE_LIMITED", `${provider} daily request limit reached`);
  }
  if ("tpd" in config && config.tpd && bucket.tokensToday + estimatedTokens > config.tpd) {
    throw new ProviderError("RATE_LIMITED", `${provider} daily token limit reached`);
  }

  bucket.requestsThisMinute += 1;
  bucket.requestsToday += 1;
  bucket.tokensThisMinute += estimatedTokens;
  bucket.tokensToday += estimatedTokens;
}

function estimateTokens(messages: ChatMessage[], maxTokens: number): number {
  const chars = messages.reduce((sum, message) => sum + message.content.length, 0);
  return Math.ceil(chars / 4) + maxTokens;
}

function costUsd(modelId: string, inputTokens: number, outputTokens: number): number {
  const assignment = MODEL_ASSIGNMENTS.attackers.find(
    (candidate) => candidate.model_id === modelId || candidate.fallbacks.includes(modelId),
  );
  const pricing = assignment?.pricing_usd_per_million;
  if (!pricing) return 0;
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  );
}

function endpoint(provider: ProviderName): string {
  const base = PROVIDER_CONFIG[provider].base_url.replace(/\/$/, "");
  return `${base}/chat/completions`;
}

function credential(provider: ProviderName): string {
  const value =
    provider === "openrouter"
      ? process.env.OPENROUTER_API_KEY
      : process.env.GROQ_API_KEY;
  if (!value) throw new ProviderError("AUTH", `${provider} credential is not configured`);
  return value;
}

function modelCandidates(attackerId: string): string[] {
  const assignment = MODEL_ASSIGNMENTS.attackers.find(
    (candidate) => candidate.attacker_id === attackerId,
  );
  if (!assignment) throw new ProviderError("UNAVAILABLE", `Unknown attacker ${attackerId}`);
  return [assignment.model_id, ...assignment.fallbacks];
}

function assignedModel(attackerId: string): string {
  const assignment = MODEL_ASSIGNMENTS.attackers.find(
    (candidate) => candidate.attacker_id === attackerId,
  );
  if (!assignment) throw new ProviderError("UNAVAILABLE", `Unknown attacker ${attackerId}`);
  return assignment.model_id;
}

function providerFor(attackerId: string): ProviderName {
  const assignment = MODEL_ASSIGNMENTS.attackers.find(
    (candidate) => candidate.attacker_id === attackerId,
  );
  if (!assignment) throw new ProviderError("UNAVAILABLE", `Unknown attacker ${attackerId}`);
  return assignment.provider as ProviderName;
}

function providerRouting(attackerId: string): Record<string, unknown> | undefined {
  const assignment = MODEL_ASSIGNMENTS.attackers.find(
    (candidate) => candidate.attacker_id === attackerId,
  );
  return assignment?.provider_routing && Object.keys(assignment.provider_routing).length > 0
    ? assignment.provider_routing
    : undefined;
}

export async function callAttackerModel(input: ProviderCallInput): Promise<ProviderCallResult> {
  const provider = providerFor(input.attackerId);
  const models = modelCandidates(input.attackerId);
  const maxTokens = input.maxTokens ?? 2600;
  const estimated = estimateTokens(input.messages, maxTokens);
  const key = credential(provider);
  const route = providerRouting(input.attackerId);

  let lastError: ProviderError | null = null;

  for (let index = 0; index < models.length; index += 1) {
    const modelId = models[index];
    acquire(provider, estimated);

    const body: Record<string, unknown> = {
      model: modelId,
      messages: input.messages,
      temperature: input.temperature ?? 0.2,
      max_tokens: maxTokens,
    };
    if (input.jsonMode) body.response_format = { type: "json_object" };
    if (provider === "openrouter") {
      body.reasoning = { effort: "low", exclude: true };
    }
    if (provider === "openrouter" && route) body.provider = route;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    const onAbort = () => controller.abort();
    input.signal?.addEventListener("abort", onAbort);

    try {
      const response = await fetch(endpoint(provider), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "User-Agent": "Dissent/1.0 (adversarial audit worker)",
          ...(provider === "openrouter"
            ? {
                "HTTP-Referer": process.env.APP_BASE_URL ?? "https://dissent-web.onrender.com",
                "X-Title": "Dissent adversarial audit",
              }
            : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const raw = await response.text().catch(() => "");
        const retryable = response.status === 429 || response.status >= 500;
        lastError = new ProviderError(
          response.status === 401 || response.status === 403 ? "AUTH" : "UNAVAILABLE",
          `${provider} returned ${response.status}: ${raw.slice(0, 180)}`,
        );
        if (retryable && index < models.length - 1) continue;
        throw lastError;
      }

      const data = (await response.json()) as {
        id?: string;
        model?: string;
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const text = data.choices?.[0]?.message?.content;
      if (!text || typeof text !== "string") {
        lastError = new ProviderError("INVALID_RESPONSE", `${provider} returned no text`);
        if (index < models.length - 1) continue;
        throw lastError;
      }

      const inputTokens = data.usage?.prompt_tokens ?? 0;
      const outputTokens = data.usage?.completion_tokens ?? 0;
      return {
        text,
        provider,
        modelId,
        assignedModelId: assignedModel(input.attackerId),
        publicModelName: data.model ?? modelId,
        requestId: data.id ?? null,
        inputTokens,
        outputTokens,
        estimatedCostUsd: costUsd(modelId, inputTokens, outputTokens),
        usedFallback: index > 0,
        fallbackIndex: index,
      };
    } catch (error) {
      if (error instanceof ProviderError) {
        lastError = error;
        if (error.code === "AUTH" || index >= models.length - 1) throw error;
        continue;
      }
      if (error instanceof Error && error.name === "AbortError") {
        lastError = new ProviderError("TIMEOUT", `${provider} request timed out`);
        if (index < models.length - 1) continue;
        throw lastError;
      }
      lastError = new ProviderError("UNAVAILABLE", `${provider} request failed`);
      if (index < models.length - 1) continue;
      throw lastError;
    } finally {
      clearTimeout(timeout);
      input.signal?.removeEventListener("abort", onAbort);
    }
  }

  throw lastError ?? new ProviderError("UNAVAILABLE", "No model candidate succeeded");
}

export function providerSnapshot(): Array<{
  provider: ProviderName;
  baseUrl: string;
  models: string[];
}> {
  return Object.entries(PROVIDER_CONFIG).map(([provider, config]) => ({
    provider: provider as ProviderName,
    baseUrl: config.base_url,
    models: MODEL_ASSIGNMENTS.attackers
      .filter((attacker) => attacker.provider === provider)
      .map((attacker) => attacker.model_id),
  }));
}
