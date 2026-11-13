import "server-only";

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
  if (accountId.length <= 10) return accountId;
  return `${accountId.slice(0, 6)}…${accountId.slice(-4)}`;
}

export function getAppBaseUrl(): string {
  return process.env.APP_BASE_URL ?? "http://localhost:3000";
}

export function isTeeEnabled(): boolean {
  return process.env.TEE_VERIFICATION_ENABLED === "true";
}

export function teeStatus(): string {
  return process.env.TEE_STATUS ?? "WAIVED_BUDGET_CONSTRAINT";
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}
