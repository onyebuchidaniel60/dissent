import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileSearch,
  GitCommitHorizontal,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react";

import { FixtureBadge, TeeWaiverNotice } from "@/components/fixture-badge";
import { StatusPill } from "@/components/status-pill";
import { KpiCard, PageHeader, Panel } from "@/components/ui";
import {
  DEMO_ATTACKER_RUNS,
  DEMO_AUDITS,
  DEMO_CONDITIONS,
  DEMO_TIMELINE,
} from "@/lib/demo-data";
import { getWalletSession } from "@/lib/auth";
import { getAuditBundle } from "@/lib/audit-read";
import { getWorkspaceForAccount } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  const audit = DEMO_AUDITS.find((item) => item.id === auditId);

  if (!audit) {
    const session = await getWalletSession();
    if (!session) notFound();
    const workspace = await getWorkspaceForAccount(session.accountId);
    if (!workspace) notFound();
    const bundle = await getAuditBundle(
      {
        keyId: `wallet:${session.sessionId}`,
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.workspaceName,
        clientAccountId: workspace.clientAccountId ?? "demo-client.testnet",
        scopes: ["audit:read:own", "certificate:read:own"],
      },
      auditId,
    );
    if (!bundle) notFound();
    return <LiveClientAudit bundle={bundle} />;
  }

  const sealed = DEMO_ATTACKER_RUNS.filter((run) => run.runStatus === "COMPLETED").length;

  return (
    <>
      <PageHeader
        eyebrow={`Audit ${audit.publicId} · preview`}
        title={audit.title}
        description={audit.thesis}
        actions={
          <>
            <Link href="/app/audits" className="button button--ghost">
              All audits
            </Link>
            <Link
              href={`/app/audits/${audit.id}/results`}
              className="button button--primary"
            >
              Result surface
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FixtureBadge />
        <StatusPill status={audit.status} />
        {audit.verdict ? <StatusPill status={audit.verdict} /> : null}
        <span className="tag tag--muted">{audit.asset}</span>
        <span className="tag tag--muted">{audit.venue}</span>
      </div>

      <div className="stat-grid">
        <KpiCard
          label="Lifecycle"
          value={audit.status.replaceAll("_", " ")}
          detail={audit.progress}
          icon={<ActivityIcon />}
        />
        <KpiCard
          label="Sealed attackers"
          value={`${sealed} / 8`}
          detail="Outputs stay sealed until all initial runs close"
          icon={<Users size={14} aria-hidden="true" />}
        />
        <KpiCard
          label="Committed conditions"
          value={String(audit.conditionCount)}
          detail="Every condition assessed exactly once"
          icon={<GitCommitHorizontal size={14} aria-hidden="true" />}
        />
        <KpiCard
          label="Verdict"
          value={audit.verdict ?? "Pending"}
          detail={audit.verdict ? "Deterministic policy record" : "No verdict before review closes"}
          icon={<ShieldCheck size={14} aria-hidden="true" />}
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-stack">
          <Panel title="Lifecycle" subtitle="Server-driven state, not a guessed progress bar.">
            <ol className="timeline">
              {DEMO_TIMELINE.map((item) => (
                <li key={item.label} className="timeline-item" data-state={item.state}>
                  <span className="timeline-dot" aria-hidden="true" />
                  <div>
                    <p className="timeline-label">{item.label}</p>
                    <p className="timeline-detail">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel
            title="Attacker runs"
            subtitle="Each run has a separate context and tool grant. No sibling output is visible."
            action={<span className="tag tag--muted">TEE waived</span>}
          >
            <div className="attacker-grid">
              {DEMO_ATTACKER_RUNS.map((run) => (
                <article key={run.attacker_id} className="attacker-card">
                  <div className="attacker-id">
                    {run.attacker_id}
                    <StatusPill status={run.runStatus} />
                  </div>
                  <p className="attacker-name">{run.name}</p>
                  <p className="attacker-model">{run.model_id}</p>
                  <div className="attacker-footer">
                    <span>{run.model_family}</span>
                    <span>{run.duration}</span>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-4">
              <TeeWaiverNotice compact />
            </div>
          </Panel>

          <Panel title="Condition set" subtitle="Committed preimage, visible to attackers only after finality.">
            <div className="stack-sm">
              {DEMO_CONDITIONS.map((condition) => (
                <div
                  key={condition.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-line bg-white/[0.02] p-3"
                >
                  <div className="min-w-0">
                    <p className="mono text-[10px] text-primary">{condition.id}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">
                      {condition.description}
                    </p>
                  </div>
                  <span className="tag tag--muted">{condition.severity}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="rail-stack">
          <Panel title="Commitment" subtitle="NEAR testnet registry.">
            <div className="rail-row">
              <span>Registry</span>
              <strong className="text-warn">Phase 3</strong>
            </div>
            <div className="rail-row">
              <span>Method</span>
              <strong>commit_audit</strong>
            </div>
            <div className="rail-row">
              <span>Canonicalization</span>
              <strong>RFC8785-v1</strong>
            </div>
            <div className="rail-row">
              <span>Policy</span>
              <strong>v1.0</strong>
            </div>
            <div className="mt-4 notice notice--info">
              <LockKeyhole size={15} aria-hidden="true" />
              <span>
                The preview does not display a fabricated transaction hash or a fake finality state.
              </span>
            </div>
          </Panel>

          <Panel title="Evidence review" subtitle="Re-fetch precedes adjudication.">
            <div className="rail-row">
              <span className="flex items-center gap-2">
                <FileSearch size={13} aria-hidden="true" />
                Evidence refs
              </span>
              <strong>Pending</strong>
            </div>
            <div className="rail-row">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={13} aria-hidden="true" />
                Sycophancy review
              </span>
              <strong>Pending</strong>
            </div>
            <div className="rail-row">
              <span className="flex items-center gap-2">
                <Clock3 size={13} aria-hidden="true" />
                Reproducibility
              </span>
              <strong>Pending</strong>
            </div>
            <p className="mt-4 text-[10px] leading-relaxed text-muted-2">
              A source outage becomes <span className="mono">UNVERIFIABLE</span>, never{" "}
              <span className="mono">NOT_HIT</span>. An incomplete review blocks a positive verdict.
            </p>
          </Panel>

          <Panel title="Public record" subtitle="Only approved public fields will be exposed.">
            <p className="text-[12px] leading-relaxed text-muted">
              The certificate hash, verdict, policy version and on-chain reference will be public.
              The thesis preimage, positions, evidence payloads and attacker prompts will not.
            </p>
            <Link
              href="/verify/DEMO-CERT-001"
              className="button button--ghost button--small mt-4"
            >
              Open public verifier
              <ExternalLink size={12} aria-hidden="true" />
            </Link>
          </Panel>

          <div className="notice notice--warn">
            <CircleAlert size={15} aria-hidden="true" />
            <span>
              This page is a deterministic fixture. It is not a live audit and no certificate has
              been anchored for it.
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}

function ActivityIcon() {
  return <span className="h-3 w-3 rounded-full border border-primary bg-primary/20" aria-hidden="true" />;
}


function LiveClientAudit({
  bundle,
}: {
  bundle: NonNullable<Awaited<ReturnType<typeof getAuditBundle>>>;
}) {
  const { audit, thesis, conditions, runs, findings, certificate } = bundle;
  const completed = runs.filter((run) => run.status === "COMPLETED").length;

  return (
    <>
      <PageHeader
        eyebrow={`Audit ${audit.public_audit_id} · live`}
        title={(thesis?.rationale ?? "Live audit").slice(0, 90)}
        description="This record was created through the authenticated workspace API. The full result is preserved server-side; the public certificate exposes only approved fields."
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
        <span className="tag tag--ok">live testnet</span>
        <StatusPill status={audit.status} />
        {audit.verdict ? <StatusPill status={audit.verdict} /> : null}
        <span className="tag tag--muted">{audit.public_audit_id}</span>
      </div>

      <div className="stat-grid">
        <KpiCard label="Attacker runs" value={`${completed} / 8`} detail="Completed live provider runs" icon={<Users size={14} aria-hidden="true" />} />
        <KpiCard label="Conditions" value={String(conditions.length)} detail="Committed before attack" icon={<GitCommitHorizontal size={14} aria-hidden="true" />} />
        <KpiCard label="Findings" value={String(findings.length)} detail="Accepted and minority preserved" icon={<ShieldCheck size={14} aria-hidden="true" />} />
        <KpiCard label="Certificate" value={certificate?.anchor_status ?? "Pending"} detail={certificate ? "NEAR testnet registry" : "No anchor yet"} icon={<FileSearch size={14} aria-hidden="true" />} />
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
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">{condition.description}</p>
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
                        <h3 className="finding-title">{finding.claim}</h3>
                      </div>
                      <StatusPill status={finding.review_status} />
                    </div>
                    <p className="finding-body">{finding.rationale}</p>
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
