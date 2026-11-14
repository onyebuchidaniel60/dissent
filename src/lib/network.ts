/**
 * Network configuration for the production build.
 *
 * Mainnet is the default. The preview/staging environment may explicitly set
 * NEAR_NETWORK=testnet to keep its historical testnet records verifiable.
 * No mainnet contract or account ID is invented here: registry, vault and
 * payout accounts must be supplied by the operator.
 */

import {
  DEFAULT_EXECUTION_VENUE,
  DEFAULT_NEAR_NETWORK,
  ONECLICK_BASE_URL as DEFAULT_ONECLICK_BASE_URL,
  ONECLICK_DESTINATION_ASSET as DEFAULT_ONECLICK_DESTINATION_ASSET,
  ONECLICK_ORIGIN_ASSET as DEFAULT_ONECLICK_ORIGIN_ASSET,
} from "@/lib/config";

export type NearNetwork = "mainnet" | "testnet";

function parseNetwork(value: string | undefined): NearNetwork {
  return value?.trim().toLowerCase() === "testnet" ? "testnet" : DEFAULT_NEAR_NETWORK;
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
  return process.env.EXECUTION_VENUE?.trim().toUpperCase() === "TIDEPOOL"
    ? "TIDEPOOL"
    : DEFAULT_EXECUTION_VENUE;
}

export const ONECLICK_BASE_URL =
  process.env.ONECLICK_BASE_URL ?? DEFAULT_ONECLICK_BASE_URL;

/** Mainnet wNEAR is the origin asset; the cap unit is 1:1 with NEAR. */
export const ONECLICK_ORIGIN_ASSET =
  process.env.ONECLICK_ORIGIN_ASSET ?? DEFAULT_ONECLICK_ORIGIN_ASSET;

/**
 * 1Click's mainnet USDC is the bridged NEP-141 contract, not `usdc.near`.
 * Source: GET https://1click.chaindefuser.com/v0/tokens.
 */
export const ONECLICK_DESTINATION_ASSET =
  process.env.ONECLICK_DESTINATION_ASSET ?? DEFAULT_ONECLICK_DESTINATION_ASSET;
