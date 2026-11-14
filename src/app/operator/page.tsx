import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  Network,
  Server,
  ShieldOff,
  Users,
} from "lucide-react";

import { TeeWaiverNotice } from "@/components/tee-waiver-notice";
import { KpiCard, PageHeader, Panel } from "@/components/ui";
import { StatusPill } from "@/components/status-pill";
import { getAdminRecentAudits } from "@/lib/audit-read";
import { getAdminAllowlist } from "@/lib/env";
import { MODEL_ASSIGNMENTS, PROVIDER_CONFIG } from "@/lib/model-assignments";

export const dynamic = "force-dynamic";

export default async function OperatorPage() {
  const allowlist = getAdminAllowlist();
  const liveAudits = await getAdminRecentAudits(20);

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="The control plane"
        accent="is explicit."
        description="Operator surfaces expose configuration and bounded recovery — never a hidden verdict override or a wallet key."
        actions={
          <Link href="/operator/proprietary" className="button button--primary">
            Proprietary arm
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="tag tag--ok">{allowlist.length} allowlisted operators</span>
        <span className="tag tag--muted">Wallet gate enforced</span>
      </div>

      <div className="stat-grid">
        <KpiCard
          label="Attackers"
          value={String(MODEL_ASSIGNMENTS.attackers.length)}
          detail="Frozen A01–A08 registry"
          icon={<Users size={14} aria-hidden="true" />}
        />
        <KpiCard
          label="Providers"
          value={String(Object.keys(PROVIDER_CONFIG).length)}
          detail="OpenRouter primary · Groq secondary"
          icon={<Network size={14} aria-hidden="true" />}
        />
        <KpiCard
          label="Runner"
          value="1"
          detail="In-process pg-boss"
          icon={<Server size={14} aria-hidden="true" />}
        />
        <KpiCard
          label="Audits"
          value={String(liveAudits.length)}
          detail="Workspace records"
          icon={<Database size={14} aria-hidden="true" />}
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-stack">
          <Panel
            title="Recent runs"
            subtitle="Real workspace audits. Only the operator allowlist reaches this panel."
            action={<span className="tag tag--ok">{liveAudits.length} records</span>}
            bodyClassName=""
          >
            {liveAudits.length > 0 ? (
              <div className="table-wrap">
                <table className="data-table">
                  <caption className="sr-only">Recent workspace audits</caption>
                  <thead>
                    <tr>
                      <th scope="col">Audit</th>
                      <th scope="col">State</th>
                      <th scope="col">Verdict</th>
                      <th scope="col">Created</th>
                      <th scope="col">Inspect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveAudits.map((audit) => (
                      <tr key={audit.id}>
                        <td data-label="Audit">
                          <Link className="font-mono text-[10px] text-primary" href={`/operator/audits/${audit.id}`}>
                            {audit.publicAuditId}
                          </Link>
                        </td>
                        <td data-label="State">
                          <StatusPill status={audit.status} />
                        </td>
                        <td data-label="Verdict">
                          {audit.verdict ? (
                            <StatusPill status={audit.verdict} />
                          ) : (
                            <span className="mono text-[10px] text-muted-2">Pending</span>
                          )}
                        </td>
                        <td data-label="Created">
                          <span className="mono text-[10px] text-muted-2">
                            {audit.createdAt.toISOString().replace("T", " ").slice(0, 16)} UTC
                          </span>
                        </td>
                        <td data-label="Inspect">
                          <Link
                            href={`/operator/audits/${audit.id}`}
                            className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <Database size={20} aria-hidden="true" />
                <p className="empty-title">No audits yet.</p>
                <p className="empty-copy">
                  New theses will appear here after a client prepares and funds an audit.
                </p>
              </div>
            )}
          </Panel>

          <Panel title="Provider posture" subtitle="Keys are server-side; values are never displayed.">
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(PROVIDER_CONFIG).map(([name, provider]) => (
                <div key={name} className="rounded-2xl border border-line bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold uppercase tracking-tight">
                      {name}
                    </span>
                    <span className="tag tag--ok">configured</span>
                  </div>
                  <p className="mono mt-2 break-all text-[9px] text-muted-2">{provider.base_url}</p>
                  <div className="mt-3 grid gap-1 text-[10px] text-muted">
                    <span>RPM {provider.rpm ?? "—"}</span>
                    {"tpm" in provider ? <span>TPM {provider.tpm}</span> : null}
                    {"rpd" in provider ? <span>RPD {provider.rpd}</span> : null}
                    {"tpd" in provider ? <span>TPD {provider.tpd}</span> : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 notice notice--info">
              <CheckCircle2 size={15} aria-hidden="true" />
              <span>
                Per-audit inference ceiling is enforced server-side. Provider keys are not exposed to
                attackers or browser clients.
              </span>
            </div>
          </Panel>
        </div>

        <aside className="rail-stack">
          <Panel title="Queue" subtitle="In-process durable runner.">
            <div className="rail-row">
              <span className="flex items-center gap-2">
                <Server size={13} aria-hidden="true" />
                pg-boss
              </span>
              <strong>{process.env.DATABASE_URL ? "in-process" : "inactive"}</strong>
            </div>
            <div className="rail-row">
              <span>Max concurrent audits</span>
              <strong>1</strong>
            </div>
            <div className="rail-row">
              <span>Max parallel attackers</span>
              <strong>3</strong>
            </div>
            <div className="rail-row">
              <span>Retry policy</span>
              <strong>bounded</strong>
            </div>
            <div className="rail-row">
              <span className="flex items-center gap-2">
                <Clock3 size={13} aria-hidden="true" />
                Cold start
              </span>
              <strong>~50s</strong>
            </div>
          </Panel>

          <Panel title="Admin boundary" subtitle="Server-side allowlist.">
            <div className="flex items-start gap-3">
              <ShieldOff size={17} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed text-muted">
                Operator access is derived from the verified wallet session and checked server-side
                against <span className="mono">ADMIN_WALLET_ADDRESSES</span>. A client-supplied wallet
                address is never trusted.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="tag tag--muted">{allowlist.length} allowlisted</span>
              <span className="tag tag--ok">enforced</span>
            </div>
          </Panel>

          <Panel title="Recovery limits" subtitle="What an operator may and may not do.">
            <ul className="gate-list">
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Retry an eligible failed run
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Inspect redacted run errors
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Change a committed thesis
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Override a finalized verdict
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Force an arbitrary payout
              </li>
            </ul>
          </Panel>

          <TeeWaiverNotice compact />
        </aside>
      </div>
    </>
  );
}
