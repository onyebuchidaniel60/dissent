import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileSearch, GitCommitHorizontal, ShieldCheck, Users } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { KpiCard, PageHeader, Panel } from "@/components/ui";
import { getWalletSession } from "@/lib/auth";
import { getAuditBundle } from "@/lib/audit-read";
import { explorerTxUrl } from "@/lib/network";
import { displayNarrative } from "@/lib/site";
import { getWorkspaceForAccount } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  const session = await getWalletSession();
  if (!session) notFound();

  const workspace = await getWorkspaceForAccount(session.accountId);
  if (!workspace) notFound();

  const bundle = await getAuditBundle(
    {
      keyId: `wallet:${session.sessionId}`,
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.workspaceName,
      clientAccountId: workspace.clientAccountId ?? "",
      scopes: ["audit:read:own", "certificate:read:own"],
    },
    auditId,
  );
  if (!bundle) notFound();

  return <LiveClientAudit bundle={bundle} />;
}

function LiveClientAudit({
  bundle,
}: {
  bundle: NonNullable<Awaited<ReturnType<typeof getAuditBundle>>>;
}) {
  const { audit, thesis, conditions, runs, findings, certificate, commitment, funding } = bundle;
  const completed = runs.filter((run) => run.status === "COMPLETED").length;

  return (
    <>
      <PageHeader
        eyebrow="Live workspace audit"
        title="The record is"
        accent={audit.public_audit_id}
        description={displayNarrative(thesis?.rationale) || "This record was created through the authenticated workspace API."}
        actions={
          <>
            <Link href="/app/audits" className="button button--ghost">
              All audits
            </Link>
            {certificate ? (
              <Link href={`/verify/${certificate.id}`} className="button button--primary">
                Public verify
                <ExternalLink size={14} aria-hidden="true" />
              </Link>
            ) : null}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="tag tag--ok">Live</span>
        <StatusPill status={audit.status} />
        {audit.verdict ? <StatusPill status={audit.verdict} /> : null}
        <span className="tag tag--muted">{audit.public_audit_id}</span>
      </div>

      <div className="stat-grid">
        <KpiCard label="Attacker runs" value={`${completed} / 8`} detail="Completed live provider runs" icon={<Users size={14} aria-hidden="true" />} />
        <KpiCard label="Conditions" value={String(conditions.length)} detail="Committed before attack" icon={<GitCommitHorizontal size={14} aria-hidden="true" />} />
        <KpiCard label="Findings" value={String(findings.length)} detail="Accepted and minority preserved" icon={<ShieldCheck size={14} aria-hidden="true" />} />
        <KpiCard label="Certificate" value={certificate?.anchor_status ?? "Pending"} detail={certificate ? "NEAR registry" : "No anchor yet"} icon={<FileSearch size={14} aria-hidden="true" />} />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-stack">
          <Panel title="Committed conditions" subtitle="The client cannot change these after commitment.">
            <div className="stack-sm">
              {conditions.map((condition) => (
                <div key={condition.condition_id} className="rounded-xl border border-line bg-white/[0.02] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="mono text-[10px] text-primary">{condition.condition_id}</span>
                    <span className="tag tag--muted">{condition.severity}</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">{displayNarrative(condition.description)}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Attacker runs" subtitle="One isolated method per run; outputs sealed before review.">
            <div className="attacker-grid">
              {runs.map((run) => (
                <article key={run.id} className="attacker-card">
                  <div className="attacker-id">
                    {run.attackerId}
                    <StatusPill status={run.status} />
                  </div>
                  <p className="attacker-model">generation {run.runGeneration}</p>
                  <div className="attacker-footer">
                    <span>{run.inputTokens ?? 0} in</span>
                    <span>{run.outputTokens ?? 0} out</span>
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Findings" subtitle="Accepted findings and preserved minority records.">
            {findings.length > 0 ? (
              <div className="stack-sm">
                {findings.map((finding) => (
                  <article key={finding.id} className="finding">
                    <div className="finding-head">
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="mono text-[9px] text-primary">{finding.finding_key}</span>
                          <span className="tag tag--muted">Section {finding.section}</span>
                        </div>
                        <h3 className="finding-title">{displayNarrative(finding.claim)}</h3>
                      </div>
                      <StatusPill status={finding.review_status} />
                    </div>
                    <p className="finding-body">{displayNarrative(finding.rationale)}</p>
                    <div className="finding-meta">
                      <span className="tag tag--muted">{finding.severity}</span>
                      {finding.evidence_status ? <StatusPill status={finding.evidence_status} /> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted">No findings recorded.</p>
            )}
          </Panel>
        </div>

        <aside className="rail-stack">
          <Panel title="Certificate" subtitle="Only approved public fields are published.">
            {certificate ? (
              <div className="stack-md">
                <div className="rail-row">
                  <span>Status</span>
                  <strong>{certificate.anchor_status}</strong>
                </div>
                <div className="hash-box">
                  <span className="hash-label">Certificate hash</span>
                  <span className="hash-value">{certificate.certificate_hash}</span>
                </div>
                <Link href={`/verify/${certificate.id}`} className="button button--primary button--small">
                  Open public verifier
                  <ExternalLink size={12} aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <p className="text-[12px] text-muted">The certificate is not finalized yet.</p>
            )}
          </Panel>

          <Panel title="Commitment & funding" subtitle="On-chain transactions.">
            <div className="rail-row">
              <span>Commitment</span>
              <strong className="break-all">
                {commitment ? (
                  <a
                    href={explorerTxUrl(commitment.transactionHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    {commitment.transactionHash.slice(0, 10)}…
                  </a>
                ) : "pending"}
              </strong>
            </div>
            <div className="rail-row">
              <span>Block</span>
              <strong>{commitment?.blockHeight ?? "—"}</strong>
            </div>
            <div className="rail-row">
              <span>Funding</span>
              <strong className="break-all">
                {funding ? (
                  <a
                    href={explorerTxUrl(funding.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    {funding.txHash.slice(0, 10)}…
                  </a>
                ) : "pending"}
              </strong>
            </div>
            <div className="rail-row">
              <span>Fee</span>
              <strong>{funding ? "quoted fee" : "—"}</strong>
            </div>
          </Panel>

          <Panel title="Evidence boundary" subtitle="Re-fetch precedes acceptance.">
            <p className="text-[12px] leading-relaxed text-muted">
              Evidence records are stored with typed locators and server-calculated hashes. A missing
              source remains UNVERIFIABLE; it never becomes NOT_HIT.
            </p>
          </Panel>
        </aside>
      </div>
    </>
  );
}
