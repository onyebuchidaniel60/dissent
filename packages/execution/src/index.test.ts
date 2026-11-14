import { describe, expect, it, vi } from "vitest";

import {
  OneClickExecutionAdapter,
  TidepoolExecutionAdapter,
  executionConfigFromEnv,
  executionReadiness,
  type ExecutionConfig,
  type VaultClient,
} from "./index";

const config: ExecutionConfig = {
  enabled: true,
  venue: "ONECLICK",
  vaultAccountId: "vault.near",
  agentAccountId: "agent.near",
  agentKey: "ed25519:test",
  recipientId: "1click-deposit.near",
  amountYocto: "500000000000000000000000",
  ftTokenId: "wrap.near",
  vaultSupportsNep141: true,
};

function vault(overrides?: Partial<VaultClient>): VaultClient {
  return {
    spendAs: vi.fn(async () => ({ transactionHash: "tx-native" })),
    spendFtAs: vi.fn(async () => ({ transactionHash: "tx-123" })),
    ...overrides,
  };
}

describe("execution adapter", () => {
  it("refuses non-TRADE verdicts without calling the vault", async () => {
    const client = vault();
    const adapter = new OneClickExecutionAdapter({ vault: client, config });
    const result = await adapter.execute("cert-1", "REFUSE");
    expect(result).toEqual({ status: "REFUSED", reason: "VERDICT_NOT_TRADE" });
    expect(client.spendFtAs).not.toHaveBeenCalled();
    expect(client.spendAs).not.toHaveBeenCalled();
  });

  it("executes a TRADE with the certificate-bound memo", async () => {
    const client = vault();
    const adapter = new OneClickExecutionAdapter({ vault: client, config });
    const result = await adapter.execute("cert-1", "TRADE");
    expect(result).toEqual({ status: "EXECUTED", tx_hash: "tx-123" });
    expect(client.spendFtAs).toHaveBeenCalledWith({
      certificateId: "cert-1",
      recipientId: "1click-deposit.near",
      amountYocto: "500000000000000000000000",
      memo: "Dissent certificate_id=cert-1",
      tokenId: "wrap.near",
    });
    expect(client.spendAs).not.toHaveBeenCalled();
  });

  it("returns the vault revert reason", async () => {
    const client = vault({
      spendFtAs: vi.fn(async () => {
        throw new Error("amount exceeds per-transaction cap");
      }),
    });
    const adapter = new OneClickExecutionAdapter({ vault: client, config });
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
    expect(client.spendFtAs).not.toHaveBeenCalled();
  });

  it("reports NOT_CONFIGURED when execution is disabled", () => {
    expect(
      executionReadiness({ verdict: "TRADE", config: { ...config, enabled: false }, venueAvailable: true }),
    ).toEqual({ status: "NOT_CONFIGURED", reason: "EXECUTION_DISABLED" });
  });

  it("reports NOT_CONFIGURED when the venue is unavailable", () => {
    expect(executionReadiness({ verdict: "TRADE", config, venueAvailable: false })).toEqual({
      status: "NOT_CONFIGURED",
      reason: "ONECLICK_UNAVAILABLE",
    });
  });

  it("runs the testnet Tidepool adapter only when the venue is TIDEPOOL", async () => {
    const client = vault();
    const tidepool = new TidepoolExecutionAdapter({
      vault: client,
      config: { ...config, venue: "TIDEPOOL", recipientId: "tidepool-deposit.testnet", ftTokenId: "wnear.tidepool-sandbox.testnet" },
    });
    const result = await tidepool.execute("cert-1", "TRADE");
    expect(result).toEqual({ status: "EXECUTED", tx_hash: "tx-123" });
  });

  it("reads the mainnet 1Click configuration by default", () => {
    const previousVenue = process.env.EXECUTION_VENUE;
    delete process.env.EXECUTION_VENUE;
    const parsed = executionConfigFromEnv();
    expect(parsed.enabled).toBe(false);
    expect(parsed.venue).toBe("ONECLICK");
    expect(parsed.ftTokenId).toBe("wrap.near");
    if (previousVenue !== undefined) process.env.EXECUTION_VENUE = previousVenue;
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
