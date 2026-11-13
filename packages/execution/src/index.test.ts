import { describe, expect, it, vi } from "vitest";

import {
  TidepoolExecutionAdapter,
  executionReadiness,
  type ExecutionConfig,
  type VaultClient,
} from "./index";

const config: ExecutionConfig = {
  enabled: true,
  vaultAccountId: "vault.testnet",
  agentAccountId: "agent.testnet",
  agentKey: "ed25519:test",
  recipientId: "tidepool-deposit.testnet",
  amountYocto: "500000000000000000000000",
  vaultSupportsNep141: true,
};

function vault(overrides?: Partial<VaultClient>): VaultClient {
  return {
    spendAs: vi.fn(async () => ({ transactionHash: "tx-123" })),
    ...overrides,
  };
}

describe("execution adapter", () => {
  it("refuses non-TRADE verdicts without calling the vault", async () => {
    const client = vault();
    const adapter = new TidepoolExecutionAdapter({ vault: client, config });
    const result = await adapter.execute("cert-1", "REFUSE");
    expect(result).toEqual({ status: "REFUSED", reason: "VERDICT_NOT_TRADE" });
    expect(client.spendAs).not.toHaveBeenCalled();
  });

  it("executes a TRADE with the certificate-bound memo", async () => {
    const client = vault();
    const adapter = new TidepoolExecutionAdapter({ vault: client, config });
    const result = await adapter.execute("cert-1", "TRADE");
    expect(result).toEqual({ status: "EXECUTED", tx_hash: "tx-123" });
    expect(client.spendAs).toHaveBeenCalledWith({
      certificateId: "cert-1",
      recipientId: "tidepool-deposit.testnet",
      amountYocto: "500000000000000000000000",
      memo: "Dissent certificate_id=cert-1",
    });
  });

  it("returns the vault revert reason", async () => {
    const client = vault({
      spendAs: vi.fn(async () => {
        throw new Error("amount exceeds per-transaction cap");
      }),
    });
    const adapter = new TidepoolExecutionAdapter({ vault: client, config });
    const result = await adapter.execute("cert-1", "TRADE");
    expect(result.status).toBe("REVERTED");
    expect(result.reason).toContain("per-transaction cap");
  });

  it("refuses when execution is disabled", async () => {
    const client = vault();
    const adapter = new TidepoolExecutionAdapter({
      vault: client,
      config: { ...config, enabled: false },
    });
    const result = await adapter.execute("cert-1", "TRADE");
    expect(result.status).toBe("REFUSED");
    expect(client.spendAs).not.toHaveBeenCalled();
  });

  it("reports NOT_CONFIGURED when the venue is unavailable", () => {
    expect(executionReadiness({ verdict: "TRADE", config, venueAvailable: false })).toEqual({
      status: "NOT_CONFIGURED",
      reason: "TIDEPOOL_UNAVAILABLE",
    });
  });

  it("reports NOT_CONFIGURED when the vault cannot spend NEP-141", () => {
    expect(
      executionReadiness({ verdict: "TRADE", config: { ...config, vaultSupportsNep141: false }, venueAvailable: true }),
    ).toEqual({ status: "NOT_CONFIGURED", reason: "VAULT_NATIVE_NEAR_ONLY" });
  });

  it("reports READY when the vault and venue are configured", () => {
    expect(executionReadiness({ verdict: "TRADE", config, venueAvailable: true })).toEqual({
      status: "READY",
    });
  });
});
