/**
 * Production defaults shared by the server configuration and the operator UI.
 * Environment variables may override these, but the safe values are the
 * defaults: mainnet, 1Click primary, execution disabled.
 */
export const DEFAULT_NEAR_NETWORK = "mainnet" as const;
export const DEFAULT_WALLET_NETWORK = "mainnet" as const;
export const DEFAULT_EXECUTION_VENUE = "ONECLICK" as const;
export const DEFAULT_EXECUTION_ENABLED = false;
export const DEFAULT_PROPRIETARY_LOOP_ENABLED = false;

export const ONECLICK_BASE_URL = "https://1click.chaindefuser.com";
export const ONECLICK_ORIGIN_ASSET = "nep141:wrap.near";
export const ONECLICK_DESTINATION_ASSET =
  "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";
