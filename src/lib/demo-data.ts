import { MODEL_ASSIGNMENTS } from "./model-assignments";

export type AuditStatus =
  | "AWAITING_COMMITMENT"
  | "COMMITTED"
  | "AWAITING_FUNDING"
  | "FUNDED"
  | "ATTACKING"
  | "EVIDENCE_REVIEW"
  | "ADJUDICATING"
  | "COMPLETED"
  | "ABSTAIN";

export type Verdict = "TRADE" | "REFUSE" | "ABSTAIN";

export type DemoAudit = {
  id: string;
  publicId: string;
  title: string;
  thesis: string;
  action: string;
  asset: string;
  venue: string;
  status: AuditStatus;
  verdict: Verdict | null;
  conditionCount: number;
  progress: string;
  updatedAt: string;
  fixture: true;
};

export const DEMO_AUDITS: DemoAudit[] = [
  {
    id: "demo-audit-001",
    publicId: "AUD-7F3K-9Q2M",
    title: "NEAR / USDC liquidity provision",
    thesis:
      "Provide two-sided liquidity into the NEAR/USDC pool while volatility remains contained and exit depth stays above the proposed notional.",
    action: "ADD_LIQUIDITY",
    asset: "NEAR / USDC",
    venue: "Ref Finance",
    status: "ATTACKING",
    verdict: null,
    conditionCount: 6,
    progress: "5 of 8 attackers sealed",
    updatedAt: "2026-11-13T10:42:00Z",
    fixture: true,
  },
  {
    id: "demo-audit-000",
    publicId: "AUD-2M8P-4C1V",
    title: "Validator staking allocation",
    thesis:
      "Stake a treasury allocation across a diversified validator set while maintaining enough liquid balance to cover a 30-day operating runway.",
    action: "STAKE",
    asset: "NEAR",
    venue: "Native staking",
    status: "COMPLETED",
    verdict: "ABSTAIN",
    conditionCount: 5,
    progress: "Certificate pending anchor",
    updatedAt: "2026-11-12T16:18:00Z",
    fixture: true,
  },
  {
    id: "demo-audit-00d",
    publicId: "AUD-9R1T-6B4N",
    title: "USDC lending position",
    thesis:
      "Supply USDC to a blue-chip lending market while utilization and withdrawal liquidity remain inside the committed bounds.",
    action: "SUPPLY",
    asset: "USDC",
    venue: "Lending market",
    status: "AWAITING_FUNDING",
    verdict: null,
    conditionCount: 4,
    progress: "Commitment verified; fee quote open",
    updatedAt: "2026-11-12T11:05:00Z",
    fixture: true,
  },
];

export const DEMO_ATTACKER_RUNS = MODEL_ASSIGNMENTS.attackers.map((assignment, index) => {
  const statuses = [
    "COMPLETED",
    "COMPLETED",
    "COMPLETED",
    "COMPLETED",
    "COMPLETED",
    "RUNNING",
    "QUEUED",
    "QUEUED",
  ] as const;

  return {
    ...assignment,
    runStatus: statuses[index] ?? "QUEUED",
    startedAt: index < 5 ? "2026-11-13T10:31:00Z" : null,
    duration: index < 5 ? `${18 + index * 4}s` : "—",
    findingCount: index < 5 ? [2, 1, 3, 1, 2][index] : 0,
    sectionB: index < 5,
  };
});

export const DEMO_CONDITIONS = [
  {
    id: "FC-001",
    description: "NEAR spot price remains below USD 2.50 at the evaluation snapshot",
    severity: "CRITICAL",
    assessments: ["HIT", "HIT", "HIT", "PARTIAL", "NOT_HIT", "HIT", "HIT", "HIT"],
  },
  {
    id: "FC-002",
    description: "Executable pool depth supports the full proposed notional with under 3% impact",
    severity: "HIGH",
    assessments: ["HIT", "PARTIAL", "HIT", "HIT", "HIT", "HIT", "HIT", "PARTIAL"],
  },
  {
    id: "FC-003",
    description: "USDC depeg exceeds 1.5% on any approved independent observation",
    severity: "CRITICAL",
    assessments: ["NOT_HIT", "NOT_HIT", "NOT_HIT", "NOT_HIT", "NOT_HIT", "NOT_HIT", "NOT_HIT", "NOT_HIT"],
  },
  {
    id: "FC-004",
    description: "Protocol TVL falls more than 20% within the committed evaluation window",
    severity: "HIGH",
    assessments: ["NOT_HIT", "NOT_HIT", "NOT_HIT", "UNVERIFIABLE", "NOT_HIT", "NOT_HIT", "NOT_HIT", "NOT_HIT"],
  },
  {
    id: "FC-005",
    description: "The thesis remains valid after a 30% drawdown in the paired asset",
    severity: "NORMAL",
    assessments: ["INVALID_TEST", "PARTIAL", "PARTIAL", "PARTIAL", "PARTIAL", "PARTIAL", "PARTIAL", "PARTIAL"],
  },
  {
    id: "FC-006",
    description: "Exit route can be completed within the committed 10-minute window",
    severity: "NORMAL",
    assessments: ["HIT", "HIT", "PARTIAL", "HIT", "HIT", "HIT", "HIT", "HIT"],
  },
] as const;

export type AssessmentStatus =
  | "HIT"
  | "PARTIAL"
  | "NOT_HIT"
  | "INVALID_TEST"
  | "UNVERIFIABLE";

export const DEMO_FINDINGS = [
  {
    id: "F-B-003",
    attacker: "A01",
    section: "B" as const,
    title: "Executable depth is concentrated in one pool",
    category: "LIQUIDITY_RISK",
    severity: "HIGH",
    evidence: "VERIFIED",
    reproducibility: "REPRODUCED",
    review: "ACCEPTED",
    novelty: "NOVEL",
    summary:
      "The headline route quote hides a concentration of executable depth in a single pool. The proposed size may experience materially higher impact than the headline quote suggests.",
    outside: "The client conditions test price decline and total TVL, but not the distribution of executable liquidity.",
    fixture: true,
  },
  {
    id: "F-A-006",
    attacker: "A03",
    section: "A" as const,
    title: "Condition FC-005 cannot be falsified as written",
    category: "LOGICAL_CONTRADICTION",
    severity: "MEDIUM",
    evidence: "VERIFIED",
    reproducibility: "NOT_REPLAYABLE_SOURCE_LIMITATION",
    review: "ACCEPTED",
    novelty: "NOVEL",
    summary:
      "The condition has no measurable threshold, observation source, or evaluation window. It cannot distinguish a valid thesis from a comfortable narrative.",
    outside: "Structural critique of the committed test itself.",
    fixture: true,
  },
  {
    id: "F-B-007",
    attacker: "A06",
    section: "B" as const,
    title: "Price observation source disagrees with the execution venue",
    category: "DATA_INTEGRITY",
    severity: "MEDIUM",
    evidence: "PARTIALLY_VERIFIED",
    reproducibility: "PARTIALLY_REPRODUCED",
    review: "NEEDS_REVIEW",
    novelty: "PARTIAL_NOVELTY",
    summary:
      "The independent observation and the venue quote differ by more than the committed tolerance at the same normalized timestamp. The discrepancy is unresolved.",
    outside: "The client conditions do not specify a cross-source tolerance.",
    fixture: true,
  },
] as const;

export const DEMO_TIMELINE = [
  { label: "Thesis prepared", detail: "Canonical hashes generated", state: "complete" },
  { label: "Conditions committed", detail: "NEAR testnet registry", state: "complete" },
  { label: "Audit fee funded", detail: "Exact quote-bound deposit", state: "complete" },
  { label: "Eight attackers dispatched", detail: "Isolated run contexts", state: "active" },
  { label: "Evidence review", detail: "Re-fetch and classify claims", state: "pending" },
  { label: "Sycophancy review", detail: "Novelty and method quality", state: "pending" },
  { label: "Adjudication", detail: "Deterministic policy v1.0", state: "pending" },
  { label: "Certificate anchored", detail: "NEAR registry", state: "pending" },
] as const;

export const DEMO_AUDIT = DEMO_AUDITS[0];
