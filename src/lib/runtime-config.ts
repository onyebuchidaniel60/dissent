import { executionConfigFromEnv } from "../../packages/execution/src/index";
import {
  IS_MAINNET,
  NEAR_NETWORK,
  NEAR_RPC_URL,
  executionVenue,
  registryAccountId,
  vaultAccountId,
} from "@/lib/network";

export type RuntimeConfigCheck = {
  ok: boolean;
  errors: string[];
  network: "mainnet" | "testnet";
  venue: "ONECLICK" | "TIDEPOOL";
};

/**
 * Fail-closed runtime validation. The application can still serve read-only
 * pages while unconfigured, but /readyz must not report ready for a mainnet
 * deployment that points at testnet infrastructure or claims execution
 * without a vault, Function Call Key and quote accounts.
 */
export function validateRuntimeConfig(): RuntimeConfigCheck {
  const errors: string[] = [];

  if (!registryAccountId()) errors.push("REGISTRY_NOT_CONFIGURED");

  if (IS_MAINNET) {
    if (!NEAR_RPC_URL.includes("mainnet")) errors.push("MAINNET_RPC_MISMATCH");
    if (registryAccountId()?.toLowerCase().endsWith(".testnet")) {
      errors.push("TESTNET_REGISTRY_ON_MAINNET");
    }
    if (vaultAccountId()?.toLowerCase().endsWith(".testnet")) {
      errors.push("TESTNET_VAULT_ON_MAINNET");
    }
  }

  if (process.env.EXECUTION_ENABLED === "true") {
    const execution = executionConfigFromEnv();
    if (!execution.vaultAccountId || !execution.agentAccountId || !execution.agentKey) {
      errors.push("EXECUTION_VAULT_NOT_CONFIGURED");
    }
    if (!execution.vaultSupportsNep141) errors.push("EXECUTION_VAULT_NOT_NEP141");
    if (!execution.recipientId) errors.push("EXECUTION_QUOTE_ADDRESS_MISSING");
    if (!execution.amountYocto) errors.push("EXECUTION_AMOUNT_MISSING");
    if (
      execution.venue === "ONECLICK" &&
      (!process.env.PROPRIETARY_RECIPIENT?.trim() || !process.env.PROPRIETARY_REFUND_TO?.trim())
    ) {
      errors.push("ONECLICK_ACCOUNTS_MISSING");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    network: NEAR_NETWORK,
    venue: executionVenue(),
  };
}
