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
import { getAdminAudit } from "@/lib/audit-read";
import { DEMO_ATTACKER_RUNS, DEMO_AUDITS } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function OperatorAuditPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  const audit = DEMO_AUDITS.find((item) => item.id === auditId);
  if (!audit) {
    const live = await getAdminAudit(auditId);
    if (!live) notFound();
    return <LiveAuditInspection live={live} />;
  }

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

function LiveAuditInspection({
  live,
}: {
  live: NonNullable<Awaited<ReturnType<typeof getAdminAudit>>>;
}) {
  const { audit, runs, certificate, adjudication, allocations } = live;
  const allocatedYocto = allocations.reduce((sum, allocation) => sum + BigInt(allocation.amountYocto), 0n);
  const allocatedNear = Number(allocatedYocto) / 1e24;
  const completed = runs.filter((run) => run.status === "COMPLETED").length;
  const totalCost = runs.reduce((sum, run) => sum + (run.estimatedCostMicrounits ?? 0), 0);

  return (
    <>
      <PageHeader
        eyebrow={`Operations · live testnet · ${audit.publicAuditId}`}
        title="Real run,"
        accent="immutable evidence."
        description="This audit was created through the API, committed on NEAR testnet, funded, attacked and adjudicated. Raw prompts and chain-of-thought are not exposed."
        actions={
          <Link href="/operator" className="button button--ghost">
            <ArrowLeft size={14} aria-hidden="true" />
            Operations
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="tag tag--ok">Live testnet</span>
        <StatusPill status={audit.status} />
        {audit.verdict ? <StatusPill status={audit.verdict} /> : null}
        <span className="tag tag--muted">{audit.publicAuditId}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <div className="dashboard-stack">
          <Panel title="Run inventory" subtitle="Eight isolated attacker runs. No sibling output is exposed.">
            <div className="stack-sm">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white/[0.02] p-3"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mono text-[10px] text-primary">{run.attackerId}</span>
                      <span className="mono text-[9px] text-muted-2">generation {run.runGeneration}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">
                      {run.inputTokens ?? 0} in · {run.outputTokens ?? 0} out · $
                      {((run.estimatedCostMicrounits ?? 0) / 1_000_000).toFixed(4)}
                    </p>
                  </div>
                  <StatusPill status={run.status} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
              <span className="tag tag--muted">{completed} / 8 completed</span>
              <span className="tag tag--muted">${(totalCost / 1_000_000).toFixed(4)} inference</span>
              <span className="tag tag--warn">TEE waived</span>
            </div>
          </Panel>

          <Panel title="Adjudication" subtitle="Deterministic gate trace; no majority vote.">
            {adjudication ? (
              <div className="stack-md">
                <div className="verdict-block">
                  <span className="verdict-label">Protocol verdict</span>
                  <span className="verdict-value" data-verdict={adjudication.verdict}>
                    {adjudication.verdict}
                  </span>
                  <span className="text-[11px] text-muted">
                    Divergence index: {adjudication.divergenceIndex ?? "undefined"}
                  </span>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <caption className="sr-only">Adjudication gates</caption>
                    <thead>
                      <tr>
                        <th scope="col">Gate</th>
                        <th scope="col">Result</th>
                        <th scope="col">Explanation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(adjudication.gateResults as Array<{ gate_id: string; passed: boolean; explanation_code: string }>).map(
                        (gate) => (
                          <tr key={gate.gate_id}>
                            <td data-label="Gate">
                              <span className="mono text-[10px]">{gate.gate_id}</span>
                            </td>
                            <td data-label="Result">
                              {gate.passed ? (
                                <span className="tag tag--ok">pass</span>
                              ) : (
                                <span className="tag tag--danger">blocked</span>
                              )}
                            </td>
                            <td data-label="Explanation">
                              <span className="mono text-[9px] text-muted-2">{gate.explanation_code}</span>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-muted">Adjudication has not run for this audit.</p>
            )}
          </Panel>
        </div>

        <div className="rail-stack">
          <Panel title="Certificate" subtitle="Hash-anchored on NEAR testnet.">
            {certificate ? (
              <div className="stack-md">
                <div className="rail-row">
                  <span>Status</span>
                  <strong>{certificate.anchorStatus}</strong>
                </div>
                <div className="hash-box">
                  <span className="hash-label">Certificate hash</span>
                  <span className="hash-value">{certificate.certificateHash}</span>
                </div>
                <Link
                  href={`/verify/${certificate.id}`}
                  className="button button--primary button--small"
                  target="_blank"
                  rel="noreferrer"
                >
                  Public verify
                  <ArrowLeft size={12} className="rotate-180" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <p className="text-[12px] text-muted">No certificate finalized.</p>
            )}
          </Panel>

          <Panel title="Bounty accounting" subtitle="Testnet allocations; no claim executed.">
            <div className="rail-row">
              <span>Accepted allocations</span>
              <strong>{allocations.length}</strong>
            </div>
            <div className="rail-row">
              <span>Total allocated</span>
              <strong>{allocatedNear.toFixed(4)} NEAR</strong>
            </div>
            <div className="rail-row">
              <span>Recipient</span>
              <strong className="break-all">{allocations[0]?.recipientAccountId ?? "payout.dissent-demo.testnet"}</strong>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {allocations.slice(0, 4).map((allocation) => (
                <span key={allocation.id} className="tag tag--muted">
                  {allocation.attackerId} · {(Number(allocation.amountYocto) / 1e24).toFixed(4)} NEAR
                </span>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-muted-2">
              Allocations are recorded on the registry contract. The payout account can claim them
              individually; no automatic transfer is made.
            </p>
          </Panel>

          <Panel title="Boundary" subtitle="Operator recovery only.">
            <p className="text-[11px] leading-relaxed text-muted">
              Original inputs, raw model outputs and finalized certificates are immutable. A retry
              creates a new run generation; it never rewrites the prior result.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
