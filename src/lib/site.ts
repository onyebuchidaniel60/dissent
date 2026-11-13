export const SITE = {
  name: "Dissent",
  tagline: "Adversarial audit protocol for AI trading agents",
  description:
    "Dissent challenges an AI trading agent's thesis with eight isolated attackers, verified evidence and a NEAR-anchored certificate before the agent acts.",
  repoUrl: "https://github.com/onyebuchidaniel60/dissent",
  repoLabel: "GitHub",
  docsPath: "/docs",
  appPath: "/app",
  verifyDemoPath: "/verify/DEMO-CERT-001",
  pronunciation: "dih-SENT",
  network: "NEAR testnet",
} as const;

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
