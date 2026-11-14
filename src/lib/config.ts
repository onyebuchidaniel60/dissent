/**
 * Production defaults plus the explicit preview fallback.
 *
 * The repository is mainnet-ready: set NEAR_NETWORK=mainnet and supply
 * operator-owned mainnet accounts in the environment for production.
 * When those values are absent, the live preview falls back to the testnet
 * staging record in config/preview-network.json so historical certificates
 * and wallet logins continue to work.
 */
import preview from "../../config/preview-network.json";

export const DEFAULT_NEAR_NETWORK = preview.network === "mainnet" ? "mainnet" : "testnet";
export const DEFAULT_WALLET_NETWORK = preview.walletNetwork === "mainnet" ? "mainnet" : "testnet";
export const DEFAULT_EXECUTION_VENUE = "ONECLICK" as const;
export const DEFAULT_EXECUTION_ENABLED = false;
export const DEFAULT_PROPRIETARY_LOOP_ENABLED = false;

export const DEFAULT_APP_BASE_URL = preview.appBaseUrl;
export const PREVIEW_AUTH_RECIPIENT = "https://dissent-web.onrender.com";
export const DEFAULT_RPC_URL =
  preview.network === "mainnet" ? "https://rpc.mainnet.fastnear.com" : preview.rpcUrl;
export const DEFAULT_EXPLORER_URL =
  preview.network === "mainnet" ? "https://explorer.near.org" : preview.explorerUrl;

/** Preview-only fallback accounts. Never used when mainnet is the resolved network. */
export const PREVIEW_REGISTRY_ACCOUNT_ID = preview.registryAccountId;
export const PREVIEW_VAULT_ACCOUNT_ID = preview.vaultAccountId;
export const PREVIEW_VAULT_AGENT_ACCOUNT_ID = preview.vaultAgentAccountId;
export const PREVIEW_PROPRIETARY_RECIPIENT = preview.proprietaryRecipient;
export const PREVIEW_PROPRIETARY_REFUND_TO = preview.proprietaryRefundTo;

export const ONECLICK_BASE_URL = "https://1click.chaindefuser.com";
export const ONECLICK_ORIGIN_ASSET = "nep141:wrap.near";
export const ONECLICK_DESTINATION_ASSET =
  "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";
