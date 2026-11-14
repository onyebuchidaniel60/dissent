import Link from "next/link";
import { ArrowRight, Filter, Plus, Search, WalletCards, X } from "lucide-react";

import { PageHeader, Panel } from "@/components/ui";
import { StatusPill } from "@/components/status-pill";
import { getWalletSession } from "@/lib/auth";
import { maskAccount } from "@/lib/env";
import { listWorkspaceAudits } from "@/lib/audit-service";
import { getWorkspaceForAccount } from "@/lib/workspace";
import { displayNarrative, displayVenue } from "@/lib/site";

const STATUS_OPTIONS = [
  "ALL",
  "AWAITING_COMMITMENT",
  "COMMITTED",
  "FUNDED",
  "QUEUED",
  "ATTACKING",
  "EVIDENCE_REVIEW",
  "CERTIFICATE_PENDING",
  "COMPLETED",
  "ABSTAIN",
] as const;

export const dynamic = "force-dynamic";

export default async function AuditsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await getWalletSession();
  const workspace = session ? await getWorkspaceForAccount(session.accountId) : null;
  const liveAudits = workspace ? await listWorkspaceAudits(workspace.workspaceId, 50) : [];

  const params = await searchParams;
  const status = params.status && params.status !== "ALL" ? params.status : "ALL";
  const query = (params.q ?? "").trim().toLowerCase();

  const audits = liveAudits.filter((audit) => {
    const matchesStatus = status === "ALL" || audit.status === status;
    const haystack = [
      audit.rationale ?? "",
      audit.publicAuditId,
      audit.assetId ?? "",
      audit.symbol ?? "",
      audit.executionVenue ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return matchesStatus && (query.length === 0 || haystack.includes(query));
  });

  const hasFilters = status !== "ALL" || query.length > 0;

  return (
    <>
      <PageHeader
        eyebrow="Audit ledger"
        title="Every thesis"
        accent="on the record."
        description="Owner-scoped audit records with explicit lifecycle state. The ledger is server-rendered; no cross-tenant data is returned."
        actions={
          <Link href="/app/audits/new" className="button button--primary">
            <Plus size={15} aria-hidden="true" />
            New audit
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="tag tag--ok">{liveAudits.length} records</span>
        {session ? <span className="tag tag--muted">{maskAccount(session.accountId)}</span> : null}
        {hasFilters ? <span className="tag tag--warn">Filtered</span> : null}
      </div>

      <Panel
        title="Filter the ledger"
        subtitle="Server-rendered query. No client-only fake filtering."
      >
        <form method="get" className="grid gap-3 lg:grid-cols-[1fr_220px_auto] lg:items-end">
          <div className="field">
            <label htmlFor="audit-search">Search</label>
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-2"
                aria-hidden="true"
              />
              <input
                id="audit-search"
                name="q"
                type="search"
                defaultValue={params.q ?? ""}
                placeholder="Thesis, public ID, asset or venue"
                className="input pl-9"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="audit-status">Status</label>
            <select id="audit-status" name="status" defaultValue={status} className="select">
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL"
                    ? "All statuses"
                    : option
                        .replaceAll("_", " ")
                        .toLowerCase()
                        .replace(/^\w/, (letter) => letter.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="button button--primary">
              <Filter size={14} aria-hidden="true" />
              Apply
            </button>
            {hasFilters ? (
              <Link href="/app/audits" className="button button--ghost" aria-label="Clear filters">
                <X size={14} aria-hidden="true" />
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </Panel>

      <div className="mt-4">
        {audits.length > 0 ? (
          <Panel bodyClassName="">
            <div className="table-wrap">
              <table className="data-table">
                <caption className="sr-only">Workspace audit ledger</caption>
                <thead>
                  <tr>
                    <th scope="col">Audit</th>
                    <th scope="col">Status</th>
                    <th scope="col">Verdict</th>
                    <th scope="col">Venue</th>
                    <th scope="col">Updated</th>
                    <th scope="col">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((audit) => (
                    <tr key={audit.id}>
                      <td data-label="Audit">
                        <div className="table-primary">
                          <Link href={`/app/audits/${audit.id}`}>
                            {displayNarrative(audit.rationale ?? "Untitled audit").slice(0, 78)}
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
                      <td data-label="Open">
                        <Link
                          href={`/app/audits/${audit.id}`}
                          className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary"
                        >
                          Open <ArrowRight size={11} className="inline" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : (
          <Panel>
            <div className="empty-state">
              <span className="empty-icon">
                <WalletCards size={20} aria-hidden="true" />
              </span>
              <h2 className="empty-title">
                {session ? "No audits match this view." : "Connect a wallet to see your audit ledger."}
              </h2>
              <p className="empty-copy">
                The ledger is scoped to the authenticated workspace. Clear filters or start a new
                thesis with machine-testable failure conditions.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link href="/app/audits/new" className="button button--primary button--small">
                  Start an audit
                </Link>
                {hasFilters ? (
                  <Link href="/app/audits" className="button button--ghost button--small">
                    Clear filters
                  </Link>
                ) : null}
              </div>
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}
