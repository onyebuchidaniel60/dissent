import { Account, JsonRpcProvider, actions, type KeyPairString } from "near-api-js";

export type Verdict = "TRADE" | "REFUSE" | "ABSTAIN";
export type ExecutionVenue = "ONECLICK" | "TIDEPOOL";

export type ExecutionStatus = "EXECUTED" | "REFUSED" | "REVERTED" | "NOT_CONFIGURED";

export type ExecutionResult = {
  status: ExecutionStatus;
  tx_hash?: string;
  reason?: string;
};

export type SpendRequest = {
  certificateId: string;
  recipientId: string;
  amountYocto: string;
  memo: string;
};

export type SpendFtRequest = SpendRequest & {
  tokenId: string;
};

export interface VaultClient {
  spendAs(request: SpendRequest): Promise<{ transactionHash: string }>;
  spendFtAs(request: SpendFtRequest): Promise<{ transactionHash: string }>;
}

export type ExecutionConfig = {
  enabled: boolean;
  venue: ExecutionVenue;
  vaultAccountId: string | null;
  agentAccountId: string | null;
  agentKey: string | null;
  recipientId: string | null;
  amountYocto: string | null;
  ftTokenId: string;
  vaultSupportsNep141: boolean;
};

export function executionConfigFromEnv(): ExecutionConfig {
  const configuredVenue = process.env.EXECUTION_VENUE?.trim().toUpperCase();
  const venue: ExecutionVenue =
    configuredVenue === "TIDEPOOL" || configuredVenue === "ONECLICK"
      ? configuredVenue
      : process.env.NEAR_NETWORK?.trim().toLowerCase() === "testnet"
        ? "TIDEPOOL"
        : "ONECLICK";
  return {
    enabled: process.env.EXECUTION_ENABLED === "true",
    venue,
    vaultAccountId: process.env.NEAR_VAULT_ACCOUNT_ID?.trim() || null,
    agentAccountId: process.env.NEAR_VAULT_AGENT_ACCOUNT_ID?.trim() || null,
    agentKey: process.env.NEAR_VAULT_AGENT_KEY ?? null,
    recipientId:
      (venue === "TIDEPOOL"
        ? process.env.TIDEPOOL_DEPOSIT_ADDRESS
        : process.env.ONECLICK_DEPOSIT_ADDRESS
      )?.trim() || null,
    amountYocto: process.env.PROPRIETARY_THESIS_AMOUNT_YOCTO?.trim() || null,
    ftTokenId:
      venue === "TIDEPOOL"
        ? process.env.TIDEPOOL_WNEAR_TOKEN_ID ?? "wnear.tidepool-sandbox.testnet"
        : process.env.ONECLICK_WNEAR_TOKEN_ID ?? "wrap.near",
    vaultSupportsNep141: process.env.VAULT_SUPPORTS_NEP141 === "true",
  };
}

export function executionReadiness(input: {
  verdict: Verdict;
  config: ExecutionConfig;
  venueAvailable?: boolean;
}): { status: "NOT_APPLICABLE" | "READY" | "NOT_CONFIGURED"; reason?: string } {
  if (input.verdict !== "TRADE") return { status: "NOT_APPLICABLE" };
  if (!input.config.enabled) {
    return { status: "NOT_CONFIGURED", reason: "EXECUTION_DISABLED" };
  }
  if (
    !input.config.vaultAccountId ||
    !input.config.agentAccountId ||
    !input.config.agentKey ||
    !input.config.recipientId
  ) {
    return { status: "NOT_CONFIGURED", reason: "VAULT_OR_VENUE_MISSING" };
  }
  if (input.venueAvailable === false) {
    return {
      status: "NOT_CONFIGURED",
      reason: input.config.venue === "TIDEPOOL" ? "TIDEPOOL_UNAVAILABLE" : "ONECLICK_UNAVAILABLE",
    };
  }
  if (!input.config.vaultSupportsNep141) {
    return { status: "NOT_CONFIGURED", reason: "VAULT_NATIVE_NEAR_ONLY" };
  }
  return { status: "READY" };
}

abstract class Nep141VaultExecutionAdapter {
  protected readonly vault: VaultClient;
  protected readonly config: ExecutionConfig;
  protected abstract readonly venue: ExecutionVenue;

  constructor(input: { vault: VaultClient; config: ExecutionConfig }) {
    this.vault = input.vault;
    this.config = input.config;
  }

  async execute(certificateId: string, verdict: Verdict): Promise<ExecutionResult> {
    if (!this.config.enabled) {
      return { status: "REFUSED", reason: "EXECUTION_DISABLED" };
    }
    if (verdict !== "TRADE") {
      return { status: "REFUSED", reason: "VERDICT_NOT_TRADE" };
    }
    if (this.config.venue !== this.venue) {
      return { status: "NOT_CONFIGURED", reason: "VENUE_MISMATCH" };
    }
    if (!this.config.vaultSupportsNep141) {
      return { status: "NOT_CONFIGURED", reason: "VAULT_NATIVE_NEAR_ONLY" };
    }
    if (
      !this.config.vaultAccountId ||
      !this.config.agentAccountId ||
      !this.config.agentKey ||
      !this.config.recipientId ||
      !this.config.amountYocto
    ) {
      return { status: "NOT_CONFIGURED", reason: "VAULT_OR_VENUE_MISSING" };
    }

    try {
      const result = await this.vault.spendFtAs({
        certificateId,
        recipientId: this.config.recipientId,
        amountYocto: this.config.amountYocto,
        memo: `Dissent certificate_id=${certificateId}`,
        tokenId: this.config.ftTokenId,
      });
      return { status: "EXECUTED", tx_hash: result.transactionHash };
    } catch (error) {
      return {
        status: "REVERTED",
        reason: error instanceof Error ? error.message : "VAULT_REVERTED",
      };
    }
  }
}

/** Mainnet 1Click execution path. The vault spends wNEAR to the 1Click deposit address. */
export class OneClickExecutionAdapter extends Nep141VaultExecutionAdapter {
  protected readonly venue: ExecutionVenue = "ONECLICK";
}

/** Testnet staging path retained for the preview environment. */
export class TidepoolExecutionAdapter extends Nep141VaultExecutionAdapter {
  protected readonly venue: ExecutionVenue = "TIDEPOOL";
}

export class NearVaultClient implements VaultClient {
  private readonly account: Account;

  constructor(input: {
    vaultAccountId: string;
    agentAccountId: string;
    agentKey: string;
    rpcUrl: string;
  }) {
    this.account = new Account(
      input.agentAccountId,
      new JsonRpcProvider({ url: input.rpcUrl }),
      input.agentKey as KeyPairString,
    );
    this.vaultAccountId = input.vaultAccountId;
  }

  private readonly vaultAccountId: string;

  async spendAs(request: SpendRequest): Promise<{ transactionHash: string }> {
    return this.callSpend("spend_as", request);
  }

  async spendFtAs(request: SpendFtRequest): Promise<{ transactionHash: string }> {
    return this.callSpend("spend_ft_as", request);
  }

  private async callSpend(method: "spend_as" | "spend_ft_as", request: SpendRequest): Promise<{ transactionHash: string }> {
    const outcome = await this.account.signAndSendTransaction({
      receiverId: this.vaultAccountId,
      actions: [
        actions.functionCall(
          method,
          {
            certificate_id: request.certificateId,
            recipient_id: request.recipientId,
            amount_yocto: request.amountYocto,
            memo: request.memo,
          },
          BigInt("100000000000000"),
          0n,
        ),
      ],
      waitUntil: "FINAL",
      throwOnFailure: true,
    });
    return { transactionHash: outcome.transaction_outcome.id };
  }
}

export function createExecutionAdapter(): OneClickExecutionAdapter | TidepoolExecutionAdapter {
  const config = executionConfigFromEnv();
  const vault = new NearVaultClient({
    vaultAccountId: config.vaultAccountId ?? "",
    agentAccountId: config.agentAccountId ?? "",
    agentKey: config.agentKey ?? "",
    rpcUrl:
      process.env.NEAR_RPC_URL ??
      (process.env.NEAR_NETWORK?.toLowerCase() === "testnet"
        ? "https://rpc.testnet.near.org"
        : "https://rpc.mainnet.near.org"),
  });
  return config.venue === "TIDEPOOL"
    ? new TidepoolExecutionAdapter({ vault, config })
    : new OneClickExecutionAdapter({ vault, config });
}
