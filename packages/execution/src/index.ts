import { Account, JsonRpcProvider, actions, type KeyPairString } from "near-api-js";

export type Verdict = "TRADE" | "REFUSE" | "ABSTAIN";

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

export interface VaultClient {
  spendAs(request: SpendRequest): Promise<{ transactionHash: string }>;
}

export type ExecutionConfig = {
  enabled: boolean;
  vaultAccountId: string | null;
  agentAccountId: string | null;
  agentKey: string | null;
  recipientId: string | null;
  amountYocto: string | null;
};

export function executionConfigFromEnv(): ExecutionConfig {
  return {
    enabled: process.env.EXECUTION_ENABLED === "true",
    vaultAccountId: process.env.NEAR_VAULT_ACCOUNT_ID ?? null,
    agentAccountId: process.env.NEAR_VAULT_AGENT_ACCOUNT_ID ?? null,
    agentKey: process.env.NEAR_VAULT_AGENT_KEY ?? null,
    recipientId: process.env.REF_FINANCE_TESTNET_ROUTER ?? null,
    amountYocto: process.env.PROPRIETARY_THESIS_AMOUNT_YOCTO ?? null,
  };
}

export function executionReadiness(input: {
  verdict: Verdict;
  config: ExecutionConfig;
  venueAvailable?: boolean;
}): { status: "NOT_APPLICABLE" | "READY" | "NOT_CONFIGURED"; reason?: string } {
  if (input.verdict !== "TRADE") return { status: "NOT_APPLICABLE" };
  if (
    !input.config.vaultAccountId ||
    !input.config.agentAccountId ||
    !input.config.agentKey ||
    !input.config.recipientId
  ) {
    return { status: "NOT_CONFIGURED", reason: "VAULT_OR_VENUE_MISSING" };
  }
  if (input.venueAvailable === false) {
    return { status: "NOT_CONFIGURED", reason: "REF_FINANCE_TESTNET_API_UNAVAILABLE" };
  }
  return { status: "READY" };
}

export class RefFinanceExecutionAdapter {
  private readonly vault: VaultClient;
  private readonly config: ExecutionConfig;

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
      const result = await this.vault.spendAs({
        certificateId,
        recipientId: this.config.recipientId,
        amountYocto: this.config.amountYocto,
        memo: `Dissent certificate_id=${certificateId}`,
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
    const outcome = await this.account.signAndSendTransaction({
      receiverId: this.vaultAccountId,
      actions: [
        actions.functionCall(
          "spend_as",
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

export function createExecutionAdapter(): RefFinanceExecutionAdapter {
  const config = executionConfigFromEnv();
  const vault = new NearVaultClient({
    vaultAccountId: config.vaultAccountId ?? "vault.dissent-demo.testnet",
    agentAccountId: config.agentAccountId ?? "vault-agent.dissent-demo.testnet",
    agentKey: config.agentKey ?? "",
    rpcUrl: process.env.NEAR_RPC_URL ?? "https://rpc.testnet.near.org",
  });
  return new RefFinanceExecutionAdapter({ vault, config });
}
