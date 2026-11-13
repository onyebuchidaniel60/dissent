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
  WalletCards,
} from "lucide-react";

import { FixtureBadge, TeeWaiverNotice } from "@/components/fixture-badge";
import { KpiCard, Panel, PageHeader } from "@/components/ui";
import { StatusPill } from "@/components/status-pill";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { checkDatabase } from "@/lib/db";
import { DEMO_ATTACKER_RUNS, DEMO_AUDITS } from "@/lib/demo-data";
import { PROVIDER_CONFIG, TEE_POLICY } from "@/lib/model-assignments";

export const dynamic = "force-dynamic";

const RECENT_AUDITS = DEMO_AUDITS;

export default async function AppOverviewPage() {
  const database = await checkDatabase();
  const attacking = DEMO_AUDITS.filter((audit) => audit.status === "ATTACKING").length;
  const awaitingFunding = DEMO_AUDITS.filter(
    (audit) => audit.status === "AWAITING_FUNDING",
  ).length;
  const completed = DEMO_AUDITS.filter((audit) => audit.status === "COMPLETED").length;

  return (
    <>
      <PageHeader
        eyebrow="Audit desk · preview"
        title="The thesis"
        accent="under attack."
        description="A route-complete view of the operator and client surface. Data shown here is a deterministic demo fixture until the live pipeline is wired in later phases."
        actions={
          <>
            <Link href="/app/audits/new" className="button button--primary">
              <Plus size={15} aria-hidden="true" />
              New audit
            </Link>
            <WalletConnectButton className="button button--ghost" label="Wallet session" />
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FixtureBadge />
        <span className="tag tag--muted">Preview checkpoint</span>
        <span className="tag tag--muted">No live inference</span>
      </div>

      <div className="stat-grid">
        <KpiCard
          label="Preview audits"
          value={String(DEMO_AUDITS.length)}
          detail="Synthetic fixtures, clearly labelled"
          icon={<Database size={14} aria-hidden="true" />}
        />
        <KpiCard
          label="Under attack"
          value={String(attacking)}
          detail="Five of eight runs sealed"
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
          detail="ABSTAIN · certificate pending anchor"
          icon={<ShieldCheck size={14} aria-hidden="true" />}
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-stack">
          <Panel
            title="Recent audits"
            subtitle="Owner-scoped records. Fixture data only; no live client portfolios."
            action={
              <Link href="/app/audits" className="button button--ghost button--small">
                View all
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            }
            bodyClassName=""
          >
            <div className="table-wrap">
              <table className="data-table">
                <caption className="sr-only">Recent demo audits</caption>
                <thead>
                  <tr>
                    <th scope="col">Audit</th>
                    <th scope="col">Status</th>
                    <th scope="col">Verdict</th>
                    <th scope="col">Progress</th>
                    <th scope="col">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_AUDITS.map((audit) => (
                    <tr key={audit.id}>
                      <td data-label="Audit">
                        <div className="table-primary">
                          <Link href={`/app/audits/${audit.id}`}>{audit.title}</Link>
                          <span>
                            {audit.publicId} · {audit.asset}
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
                      <td data-label="Progress">
                        <span className="text-[11px] text-muted">{audit.progress}</span>
                      </td>
                      <td data-label="Updated">
                        <span className="mono text-[10px] text-muted-2">
                          {new Date(audit.updatedAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              {DEMO_ATTACKER_RUNS.map((attacker) => (
                <article key={attacker.attacker_id} className="attacker-card">
                  <div className="attacker-id">
                    {attacker.attacker_id}
                    <span className="text-muted-2">{attacker.runStatus}</span>
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
            <div className="mt-4">
              <TeeWaiverNotice compact />
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
              <strong className="text-warn">Phase 2</strong>
            </div>
            <div className="rail-row">
              <span className="flex items-center gap-2">
                <GitCommitHorizontal size={13} aria-hidden="true" />
                NEAR registry
              </span>
              <strong className="text-warn">Phase 3</strong>
            </div>
            <div className="rail-row">
              <span className="flex items-center gap-2">
                <ShieldCheck size={13} aria-hidden="true" />
                TEE attestation
              </span>
              <strong className="text-warn">{TEE_POLICY.status}</strong>
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <p className="small-caps text-muted-2">Configured providers</p>
              <div className="mt-3 grid gap-2">
                {Object.entries(PROVIDER_CONFIG).map(([name]) => (
                  <div key={name} className="flex items-center justify-between gap-3">
                    <span className="text-[11px] capitalize text-muted">{name}</span>
                    <span className="tag tag--ok">key verified</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-muted-2">
                Provider keys were validated by health check at intake. No key value is displayed.
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

          <Panel title="Preview boundary" subtitle="What is not connected yet.">
            <ul className="gate-list">
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Live wallet challenge and session
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Contract commitment verification
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Live attacker dispatch
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Certificate anchoring
              </li>
            </ul>
            <p className="mt-4 text-[10px] leading-relaxed text-muted-2">
              These are labelled checkpoints, not hidden placeholders. The public preview never
              presents synthetic data as a live audit.
            </p>
          </Panel>
        </aside>
      </div>
    </>
  );
}
