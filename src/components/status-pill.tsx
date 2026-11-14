import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileWarning,
  LoaderCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";

type StatusTone = "ok" | "warn" | "danger" | "info" | "neutral";

const STATUS_MAP: Record<string, { tone: StatusTone; icon: LucideIcon; label: string }> = {
  COMPLETED: { tone: "ok", icon: CheckCircle2, label: "Completed" },
  COMMITTED: { tone: "info", icon: CheckCircle2, label: "Committed" },
  FUNDED: { tone: "info", icon: CheckCircle2, label: "Funded" },
  ATTACKING: { tone: "info", icon: LoaderCircle, label: "Attacking" },
  RUNNING: { tone: "info", icon: LoaderCircle, label: "Running" },
  QUEUED: { tone: "neutral", icon: Clock3, label: "Queued" },
  AWAITING_COMMITMENT: { tone: "warn", icon: Clock3, label: "Awaiting commitment" },
  AWAITING_FUNDING: { tone: "warn", icon: Clock3, label: "Awaiting funding" },
  EVIDENCE_REVIEW: { tone: "warn", icon: CircleDashed, label: "Evidence review" },
  ADJUDICATING: { tone: "warn", icon: CircleDashed, label: "Adjudicating" },
  TRADE: { tone: "ok", icon: CheckCircle2, label: "TRADE" },
  REFUSE: { tone: "danger", icon: XCircle, label: "REFUSE" },
  ABSTAIN: { tone: "warn", icon: AlertTriangle, label: "ABSTAIN" },
  FAILED: { tone: "danger", icon: XCircle, label: "Failed" },
  VERIFIED: { tone: "ok", icon: CheckCircle2, label: "Verified" },
  PARTIALLY_VERIFIED: { tone: "warn", icon: AlertTriangle, label: "Partially verified" },
  UNVERIFIABLE: { tone: "neutral", icon: FileWarning, label: "Unverifiable" },
  ACCEPTED: { tone: "ok", icon: CheckCircle2, label: "Accepted" },
  NEEDS_REVIEW: { tone: "warn", icon: AlertTriangle, label: "Needs review" },
  REJECTED: { tone: "danger", icon: XCircle, label: "Rejected" },
  NOVEL: { tone: "ok", icon: CheckCircle2, label: "Novel" },
  PARTIAL_NOVELTY: { tone: "warn", icon: AlertTriangle, label: "Partial novelty" },
  RESTATEMENT: { tone: "danger", icon: XCircle, label: "Restatement" },
  REPRODUCED: { tone: "ok", icon: CheckCircle2, label: "Reproduced" },
  PARTIALLY_REPRODUCED: { tone: "warn", icon: AlertTriangle, label: "Partially reproduced" },
  NOT_REPLAYABLE_SOURCE_LIMITATION: {
    tone: "neutral",
    icon: FileWarning,
    label: "Source-limited replay",
  },
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  const entry = STATUS_MAP[status] ?? {
    tone: "neutral" as const,
    icon: CircleDashed,
    label: status.replaceAll("_", " ").toLowerCase(),
  };
  const Icon = entry.icon;

  return (
    <span className={`status status--${entry.tone}`}>
      <Icon aria-hidden="true" className={status === "RUNNING" ? "animate-spin" : undefined} />
      {label ?? entry.label}
    </span>
  );
}
