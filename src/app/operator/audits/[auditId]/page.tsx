import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileSearch,
  LockKeyhole,
  RotateCcw,
  Server,
} from "lucide-react";

import { FixtureBadge } from "@/components/fixture-badge";
import { StatusPill } from "@/components/status-pill";
import { PageHeader, Panel } from "@/components/ui";
import { DEMO_ATTACKER_RUNS, DEMO_AUDITS } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function OperatorAuditPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  const audit = DEMO_AUDITS.find((item) => item.id === auditId);
  if (!audit) notFound();

  return (
    <>
      <PageHeader
        eyebrow={`Operations · ${audit.publicId}`}
        title="Inspect, then"
        accent="bound the retry."
        description="Operators may recover an eligible failed component from the original immutable snapshot. They cannot rewrite inputs, findings or a finalized verdict."
        actions={
          <Link href="/operator" className="button button--ghost">
            <ArrowLeft size={14} aria-hidden="true" />
            Operations
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FixtureBadge />
        <StatusPill status={audit.status} />
        <span className="tag tag--muted">{audit.publicId}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <div className="dashboard-stack">
          <Panel title="Run inventory" subtitle="Redacted provenance and state. No prompts or sibling outputs.">
            <div className="stack-sm">
              {DEMO_ATTACKER_RUNS.map((run) => (
                <div
                  key={run.attacker_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white/[0.02] p-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mono text-[10px] text-primary">{run.attacker_id}</span>
                      <span className="text-[12px] font-extrabold text-ink">{run.name}</span>
                    </div>
                    <p className="mono mt-1 truncate text-[9px] text-muted-2">{run.model_id}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={run.runStatus} />
                    <span className="mono text-[9px] text-muted-2">{run.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Retry eligibility" subtitle="Bounded and recorded; original runs are immutable.">
            <div className="notice notice--info">
              <RotateCcw size={15} aria-hidden="true" />
              <span>
                No run is currently eligible for retry in this preview, and the retry control is not
                shown as a dead button. The bounded retry service lands in Phase 5 with a required
                reason, a new run generation and a recorded model substitution.
              </span>
            </div>
            <ul className="gate-list mt-4">
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Same immutable input snapshot and method
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                New run generation, original preserved
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Model substitution recorded; diversity rechecked
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Silent finding replacement
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Verdict override
              </li>
            </ul>
          </Panel>
        </div>

        <div className="rail-stack">
          <Panel title="Audit context" subtitle="Redacted operational metadata.">
            <div className="rail-row">
              <span>Action</span>
              <strong>{audit.action}</strong>
            </div>
            <div className="rail-row">
              <span>Asset</span>
              <strong>{audit.asset}</strong>
            </div>
            <div className="rail-row">
              <span>Venue</span>
              <strong>{audit.venue}</strong>
            </div>
            <div className="rail-row">
              <span>Conditions</span>
              <strong>{audit.conditionCount}</strong>
            </div>
            <div className="rail-row">
              <span>Cost ceiling</span>
              <strong>$0.50</strong>
            </div>
          </Panel>

          <Panel title="Evidence operations" subtitle="Available once attacker outputs seal.">
            <div className="flex items-start gap-3">
              <FileSearch size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed text-muted">
                Evidence re-fetch and red-team reviews are separate worker stages. A failed review
                produces ABSTAIN; it does not skip the stage or infer a negative result.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="tag tag--muted">Phase 5</span>
              <span className="tag tag--warn">not yet runnable</span>
            </div>
          </Panel>

          <Panel title="Access boundary" subtitle="No hidden privilege.">
            <div className="flex items-start gap-3">
              <LockKeyhole size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed text-muted">
                The operator route will require a verified wallet session whose account is in the
                server allowlist. Direct database edits, key export and arbitrary settlement are not
                available from this console.
              </p>
            </div>
          </Panel>

          <div className="notice notice--warn">
            <Clock3 size={15} aria-hidden="true" />
            <span>
              Preview fixture only. No live provider call, contract call or settlement is triggered
              from this page.
            </span>
          </div>
          <div className="notice notice--info">
            <Server size={15} aria-hidden="true" />
            <span>Queue and worker state will be server-observed in Phase 2.</span>
          </div>
        </div>
      </div>
    </>
  );
}
