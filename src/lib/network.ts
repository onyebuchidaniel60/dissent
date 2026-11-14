/**
 * Network configuration for the production build.
 *
 * Mainnet is the default. The preview/staging environment may explicitly set
 * NEAR_NETWORK=testnet to keep its historical testnet records verifiable.
 * No mainnet contract or account ID is invented here: registry, vault and
 * payout accounts must be supplied by the operator.
 */

export type NearNetwork = "mainnet" | "testnet";

function parseNetwork(value: string | undefined): NearNetwork {
  return value?.trim().toLowerCase() === "testnet" ? "testnet" : "mainnet";
}

export const NEAR_NETWORK: NearNetwork = parseNetwork(process.env.NEAR_NETWORK);
export const IS_MAINNET = NEAR_NETWORK === "mainnet";

export const NEAR_RPC_URL =
  process.env.NEAR_RPC_URL ??
  (IS_MAINNET ? "https://rpc.mainnet.near.org" : "https://rpc.testnet.near.org");

export const NEAR_EXPLORER_URL =
  process.env.NEAR_EXPLORER_URL ??
  (IS_MAINNET ? "https://explorer.near.org" : "https://explorer.testnet.near.org");

/** Customer-facing network label. The UI never surfaces a testnet label. */
export const NEAR_NETWORK_LABEL = "NEAR";

export function registryAccountId(): string | null {
  return process.env.NEAR_REGISTRY_ACCOUNT_ID?.trim() || null;
}

export function escrowAccountId(): string | null {
  return process.env.NEAR_ESCROW_ACCOUNT_ID?.trim() || registryAccountId();
}

export function payoutAccountId(): string | null {
  return process.env.NEAR_PAYOUT_ACCOUNT_ID?.trim() || null;
}

export function vaultAccountId(): string | null {
  return process.env.NEAR_VAULT_ACCOUNT_ID?.trim() || null;
}

export function explorerTxUrl(txHash: string): string {
  return `${NEAR_EXPLORER_URL}/transactions/${txHash}`;
}

export function executionVenue(): "ONECLICK" | "TIDEPOOL" {
  return process.env.EXECUTION_VENUE?.trim().toUpperCase() === "TIDEPOOL" ? "TIDEPOOL" : "ONECLICK";
}

export const ONECLICK_BASE_URL =
  process.env.ONECLICK_BASE_URL ?? "https://1click.chaindefuser.com";

/** Mainnet wNEAR is the origin asset; the cap unit is 1:1 with NEAR. */
export const ONECLICK_ORIGIN_ASSET = process.env.ONECLICK_ORIGIN_ASSET ?? "nep141:wrap.near";

/**
 * 1Click's mainnet USDC is the bridged NEP-141 contract, not `usdc.near`.
 * Source: GET https://1click.chaindefuser.com/v0/tokens.
 */
export const ONECLICK_DESTINATION_ASSET =
  process.env.ONECLICK_DESTINATION_ASSET ??
  "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";
