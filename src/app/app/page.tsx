import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  GitCommitHorizontal,
  Plus,
  Server,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";

import { KpiCard, Panel, PageHeader } from "@/components/ui";
import { StatusPill } from "@/components/status-pill";
import { getWalletSession } from "@/lib/auth";
import { listWorkspaceAudits } from "@/lib/audit-service";
import { checkDatabase } from "@/lib/db";
import { ATTACKER_PROFILES } from "@/lib/attackers/profiles";
import { MODEL_ASSIGNMENTS, PROVIDER_CONFIG } from "@/lib/model-assignments";
import { NEAR_NETWORK_LABEL, registryAccountId } from "@/lib/network";
import { displayNarrative, displayVenue } from "@/lib/site";
import { getWorkspaceForAccount } from "@/lib/workspace";

export const dynamic = "force-dynamic";

const PROFILE_BY_ID = new Map(ATTACKER_PROFILES.map((profile) => [profile.attackerId, profile]));
const ROSTER = MODEL_ASSIGNMENTS.attackers.map((attacker) => ({
  ...attacker,
  name: PROFILE_BY_ID.get(attacker.attacker_id)?.name ?? attacker.attacker_id,
}));

export default async function AppOverviewPage() {
  const database = await checkDatabase();
  const session = await getWalletSession();
  const workspace = session ? await getWorkspaceForAccount(session.accountId) : null;
  const audits = workspace ? await listWorkspaceAudits(workspace.workspaceId, 6) : [];

  const attacking = audits.filter((audit) => audit.status === "ATTACKING").length;
  const awaitingFunding = audits.filter((audit) => audit.status === "AWAITING_FUNDING").length;
  const completed = audits.filter((audit) => audit.status === "COMPLETED").length;

  return (
    <>
      <PageHeader
        eyebrow="Audit desk"
        title="The thesis"
        accent="under attack."
        description="Session-scoped audit records, provider readiness and certificate state. No portfolio data or model prompts are exposed."
        actions={
          <Link href="/app/audits/new" className="button button--primary">
            <Plus size={15} aria-hidden="true" />
            New audit
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="tag tag--ok">Production desk</span>
        <span className="tag tag--muted">{NEAR_NETWORK_LABEL}</span>
        <span className="tag tag--muted">Evidence-backed</span>
        <span className="tag tag--muted">Deterministic policy</span>
      </div>

      <div className="stat-grid">
        <KpiCard
          label="Audits"
          value={String(audits.length)}
          detail={workspace ? "Session-scoped records" : "Connect a wallet to begin"}
          icon={<Database size={14} aria-hidden="true" />}
        />
        <KpiCard
          label="Under attack"
          value={String(attacking)}
          detail="Isolated attacker runs"
          icon={<Activity size={14} aria-hidden="true" />}
        />
        <KpiCard
          label="Awaiting funding"
          value={String(awaitingFunding)}
          detail="Commitment verified · quote open"
          icon={<Clock3 size={14} aria-hidden="true" />}
        />
        <KpiCard
          label="Completed"
          value={String(completed)}
          detail="Certificate and verdict recorded"
          icon={<ShieldCheck size={14} aria-hidden="true" />}
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-stack">
          <Panel
            title="Recent audits"
            subtitle="Owner-scoped records. No cross-tenant data is returned."
            action={
              <Link href="/app/audits" className="button button--ghost button--small">
                View all
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            }
            bodyClassName=""
          >
            {audits.length > 0 ? (
              <div className="table-wrap">
                <table className="data-table">
                  <caption className="sr-only">Recent workspace audits</caption>
                  <thead>
                    <tr>
                      <th scope="col">Audit</th>
                      <th scope="col">Status</th>
                      <th scope="col">Verdict</th>
                      <th scope="col">Venue</th>
                      <th scope="col">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map((audit) => (
                      <tr key={audit.id}>
                        <td data-label="Audit">
                          <div className="table-primary">
                            <Link href={`/app/audits/${audit.id}`}>
                              {displayNarrative(audit.rationale ?? "Untitled audit").slice(0, 72)}
                            </Link>
                            <span>
                              {audit.publicAuditId} · {audit.symbol ?? audit.assetId ?? "NEAR"}
                            </span>
                          </div>
                        </td>
                        <td data-label="Status">
                          <StatusPill status={audit.status} />
                        </td>
                        <td data-label="Verdict">
                          {audit.verdict ? (
                            <StatusPill status={audit.verdict} />
                          ) : (
                            <span className="mono text-[10px] text-muted-2">Pending</span>
                          )}
                        </td>
                        <td data-label="Venue">
                          <span className="mono text-[10px] text-muted">
                            {displayVenue(audit.executionVenue)}
                          </span>
                        </td>
                        <td data-label="Updated">
                          <span className="mono text-[10px] text-muted-2">
                            {audit.updatedAt.toISOString().slice(0, 16).replace("T", " ")} UTC
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">
                  <WalletCards size={20} aria-hidden="true" />
                </span>
                <h2 className="empty-title">
                  {session ? "No audits in this workspace yet." : "Connect a wallet to open the desk."}
                </h2>
                <p className="empty-copy">
                  A wallet session scopes every audit to your workspace. Start with a thesis and
                  machine-testable failure conditions; no portfolio data is required.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Link href="/app/audits/new" className="button button--primary button--small">
                    Start an audit
                  </Link>
                  <Link href="/docs" className="button button--ghost button--small">
                    Read the protocol
                  </Link>
                </div>
              </div>
            )}
          </Panel>

          <Panel
            title="Eight isolated attackers"
            subtitle="Every attacker sees the committed thesis and conditions, never a sibling output."
            action={
              <Link href="/app/attackers" className="button button--ghost button--small">
                Roster
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            }
          >
            <div className="attacker-grid">
              {ROSTER.map((attacker) => (
                <article key={attacker.attacker_id} className="attacker-card">
                  <div className="attacker-id">
                    {attacker.attacker_id}
                    <span className="text-muted-2">Ready</span>
                  </div>
                  <p className="attacker-name">{attacker.name}</p>
                  <p className="attacker-model">{attacker.model_id}</p>
                  <div className="attacker-footer">
                    <span>{attacker.model_family}</span>
                    <span>{attacker.provider}</span>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="rail-stack" aria-label="System readiness">
          <Panel title="Readiness" subtitle="Server-observed where available.">
            <div className="rail-row">
              <span className="flex items-center gap-2">
                <Database size={13} aria-hidden="true" />
                Postgres
              </span>
              <strong className={database.ok ? "text-ok" : "text-warn"}>
                {database.ok ? "connected" : "not configured"}
              </strong>
            </div>
            <div className="rail-row">
              <span className="flex items-center gap-2">
                <Server size={13} aria-hidden="true" />
                pg-boss runner
              </span>
              <strong>{process.env.DATABASE_URL ? "in-process" : "inactive"}</strong>
            </div>
            <div className="rail-row">
              <span className="flex items-center gap-2">
                <WalletCards size={13} aria-hidden="true" />
                Wallet sessions
              </span>
              <strong className={session ? "text-ok" : "text-warn"}>
                {session ? "signed nonce" : "not connected"}
              </strong>
            </div>
            <div className="rail-row">
              <span className="flex items-center gap-2">
                <GitCommitHorizontal size={13} aria-hidden="true" />
                {NEAR_NETWORK_LABEL} registry
              </span>
              <strong className={registryAccountId() ? "text-ok" : "text-warn"}>
                {registryAccountId() ? "configured" : "not configured"}
              </strong>
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <p className="small-caps text-muted-2">Configured providers</p>
              <div className="mt-3 grid gap-2">
                {Object.entries(PROVIDER_CONFIG).map(([name]) => (
                  <div key={name} className="flex items-center justify-between gap-3">
                    <span className="text-[11px] capitalize text-muted">{name}</span>
                    <span className="tag tag--ok">configured</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-muted-2">
                Provider keys are server-side only. No key value is displayed.
              </p>
            </div>
          </Panel>

          <Panel title="Policy lock" subtitle="Deterministic adjudication.">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted">Policy</span>
              <span className="mono text-[10px] text-ink">dissent-adjudication-v1.0</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted">Canonicalization</span>
              <span className="mono text-[10px] text-ink">RFC8785-v1</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted">Quote expiry</span>
              <span className="mono text-[10px] text-ink">900s</span>
            </div>
            <div className="mt-4 notice notice--info">
              <CheckCircle2 size={15} aria-hidden="true" />
              <span>
                No majority vote, no confidence weighting, no model-issued verdict. Missing coverage
                abstains.
              </span>
            </div>
          </Panel>

          <Panel title="Operational boundaries" subtitle="Fail-closed by default.">
            <ul className="gate-list">
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Owner-scoped wallet sessions and API keys
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Evidence re-fetch before acceptance
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Certificate hash anchored before execution
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Execution disabled unless explicitly enabled
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                No model wallet or shell access
              </li>
            </ul>
            <p className="mt-4 text-[10px] leading-relaxed text-muted-2">
              The execution arm is a separate, capped vault. It is disabled by default and cannot be
              reached by an attacker model.
            </p>
          </Panel>

          <Panel title="Cohort" subtitle="Eight methods, one output contract.">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted">Specialists</span>
              <span className="mono text-[10px] text-ink">8</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted">Model families</span>
              <span className="mono text-[10px] text-ink">7</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted">Inference vendors</span>
              <span className="mono text-[10px] text-ink">2</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted">Open-weight model</span>
              <span className="tag tag--ok">included</span>
            </div>
            <div className="mt-4 notice notice--info">
              <Users size={15} aria-hidden="true" />
              <span>Sibling-blind context. No attacker can read another attacker&apos;s output.</span>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}
