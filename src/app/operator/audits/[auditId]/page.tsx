import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { PageHeader, Panel } from "@/components/ui";
import { getAdminAudit } from "@/lib/audit-read";

export const dynamic = "force-dynamic";

export default async function OperatorAuditPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  const live = await getAdminAudit(auditId);
  if (!live) notFound();
  return <LiveAuditInspection live={live} />;
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
        eyebrow={`Operations · ${audit.publicAuditId}`}
        title="Real run,"
        accent="immutable evidence."
        description="This audit was created through the API, committed on NEAR, funded, attacked and adjudicated. Raw prompts and chain-of-thought are not exposed."
        actions={
          <Link href="/operator" className="button button--ghost">
            <ArrowLeft size={14} aria-hidden="true" />
            Operations
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="tag tag--ok">Live</span>
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
              <span className="tag tag--warn">TEE unavailable</span>
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
          <Panel title="Certificate" subtitle="Hash-anchored on NEAR.">
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

          <Panel title="Bounty accounting" subtitle="Recorded allocations; no automatic transfer.">
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
              <strong className="break-all">{allocations[0]?.recipientAccountId ?? "—"}</strong>
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
