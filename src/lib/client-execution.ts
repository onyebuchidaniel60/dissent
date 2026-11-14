import "server-only";

import {
  ONECLICK_DESTINATION_ASSET,
  ONECLICK_ORIGIN_ASSET,
} from "@/lib/config";
import { executionVenue } from "@/lib/network";
import {
  fetchExecutionVenueQuote,
  type ExecutionVenueQuoteResponse,
} from "@/lib/proprietary/venue";

export type ClientExecutionThesis = {
  action: string;
  position: { amount: string; unit: string };
  assetId?: string | null;
  symbol?: string | null;
};

export type ClientExecutionPlan = {
  venue: "ONECLICK" | "TIDEPOOL";
  originAsset: string;
  destinationAsset: string;
  tokenId: string;
  amountYocto: string;
  storageDepositYocto: string;
  paySymbol: "wNEAR" | "USDC";
  receiveSymbol: "wNEAR" | "USDC";
};

const STORAGE_DEPOSIT_YOCTO = "1250000000000000000000";

function venueAssets() {
  const venue = executionVenue();
  return venue === "TIDEPOOL"
    ? {
        venue,
        wnear:
          process.env.TIDEPOOL_ORIGIN_ASSET ?? "nep141:wnear.tidepool-sandbox.testnet",
        usdc:
          process.env.TIDEPOOL_DESTINATION_ASSET ?? "nep141:usdc.tidepool-sandbox.testnet",
      }
    : {
        venue,
        wnear: ONECLICK_ORIGIN_ASSET,
        usdc: ONECLICK_DESTINATION_ASSET,
      };
}

function tokenIdFromAsset(asset: string): string {
  return asset.startsWith("nep141:") ? asset.slice("nep141:".length) : asset;
}

function toYocto(amount: string, decimals: number): string {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) throw new Error("INVALID_POSITION_AMOUNT");
  const [whole, fraction = ""] = trimmed.split(".");
  const padded = fraction.padEnd(decimals, "0").slice(0, decimals);
  return (BigInt(whole) * 10n ** BigInt(decimals) + BigInt(padded || "0")).toString();
}

export function resolveClientExecutionPlan(thesis: ClientExecutionThesis): ClientExecutionPlan {
  const assets = venueAssets();
  const unit = thesis.position.unit.trim().toUpperCase();
  const action = thesis.action.trim().toUpperCase();

  const isNearLeg = unit === "NEAR" || unit === "WNEAR";
  if (isNearLeg && (action === "SELL" || action === "SHORT")) {
    return {
      venue: assets.venue,
      originAsset: assets.wnear,
      destinationAsset: assets.usdc,
      tokenId: tokenIdFromAsset(assets.wnear),
      amountYocto: toYocto(thesis.position.amount, 24),
      storageDepositYocto: STORAGE_DEPOSIT_YOCTO,
      paySymbol: "wNEAR",
      receiveSymbol: "USDC",
    };
  }

  if (unit === "USDC" && (action === "BUY" || action === "SELL")) {
    return {
      venue: assets.venue,
      originAsset: assets.usdc,
      destinationAsset: assets.wnear,
      tokenId: tokenIdFromAsset(assets.usdc),
      amountYocto: toYocto(thesis.position.amount, 6),
      storageDepositYocto: STORAGE_DEPOSIT_YOCTO,
      paySymbol: "USDC",
      receiveSymbol: "wNEAR",
    };
  }

  throw new Error("UNSUPPORTED_CLIENT_EXECUTION_THESIS");
}

export async function fetchClientExecutionQuote(input: {
  plan: ClientExecutionPlan;
  clientAccountId: string;
}): Promise<ExecutionVenueQuoteResponse> {
  return fetchExecutionVenueQuote({
    amountYocto: input.plan.amountYocto,
    recipient: input.clientAccountId,
    refundTo: input.clientAccountId,
    originAsset: input.plan.originAsset,
    destinationAsset: input.plan.destinationAsset,
    deadlineMinutes: 30,
  });
}
