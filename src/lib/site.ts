export const SITE = {
  name: "Dissent",
  tagline: "Adversarial audit protocol for AI trading agents",
  description:
    "Dissent challenges an AI trading agent's thesis with eight isolated attackers, verified evidence and a NEAR-anchored certificate before the agent acts.",
  repoUrl: "https://github.com/onyebuchidaniel60/dissent",
  repoLabel: "GitHub",
  docsPath: "/docs",
  appPath: "/app",
  verifyPath: "/docs#certificates",
  pronunciation: "dih-SENT",
  network: "NEAR",
} as const;

export function displayVenue(value: string | null | undefined): string {
  if (!value) return "—";
  const upper = value.toUpperCase();
  if (upper.includes("ONECLICK")) return "1Click";
  if (upper.includes("TIDEPOOL")) return "Tidepool";
  if (upper.includes("REF_FINANCE") || upper.includes("REF FINANCE")) return "Ref Finance";
  return value.replaceAll("_", " ");
}

export const NAV_ITEMS = [
  { href: "/app", label: "Overview" },
  { href: "/app/audits", label: "Audits" },
  { href: "/app/attackers", label: "Attackers" },
  { href: "/app/reputation", label: "Reputation" },
  { href: "/docs", label: "Docs" },
] as const;

export const OPERATOR_NAV_ITEMS = [
  { href: "/operator", label: "Operations" },
  { href: "/operator/providers", label: "Providers" },
] as const;
