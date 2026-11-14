import "server-only";

import { DEFAULT_APP_BASE_URL } from "@/lib/config";

export function getAdminAllowlist(): string[] {
  return (process.env.ADMIN_WALLET_ADDRESSES ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isAdminAccount(accountId: string | null | undefined): boolean {
  if (!accountId) return false;
  return getAdminAllowlist().includes(accountId);
}

export function maskAccount(accountId: string): string {
  const local = accountId.split(".")[0] || accountId;
  if (local.length <= 12) return local;
  return `${local.slice(0, 6)}…${local.slice(-4)}`;
}

export function getAppBaseUrl(): string {
  return process.env.APP_BASE_URL ?? DEFAULT_APP_BASE_URL;
}

export function isTeeEnabled(): boolean {
  return process.env.TEE_VERIFICATION_ENABLED === "true";
}

export function teeStatus(): string {
  return process.env.TEE_STATUS ?? "WAIVED_BUDGET_CONSTRAINT";
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}
