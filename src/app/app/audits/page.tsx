import Link from "next/link";
import { ArrowRight, Filter, Plus, Search, X } from "lucide-react";

import { FixtureBadge } from "@/components/fixture-badge";
import { PageHeader, Panel } from "@/components/ui";
import { StatusPill } from "@/components/status-pill";
import { DEMO_AUDITS, type AuditStatus } from "@/lib/demo-data";

const STATUS_OPTIONS: Array<{ value: "ALL" | AuditStatus; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "ATTACKING", label: "Attacking" },
  { value: "AWAITING_COMMITMENT", label: "Awaiting commitment" },
  { value: "AWAITING_FUNDING", label: "Awaiting funding" },
  { value: "COMPLETED", label: "Completed" },
];

export const dynamic = "force-dynamic";

export default async function AuditsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = params.status && params.status !== "ALL" ? params.status : "ALL";
  const query = (params.q ?? "").trim().toLowerCase();

  const audits = DEMO_AUDITS.filter((audit) => {
    const matchesStatus = status === "ALL" || audit.status === status;
    const matchesQuery =
      query.length === 0 ||
      audit.title.toLowerCase().includes(query) ||
      audit.publicId.toLowerCase().includes(query) ||
      audit.asset.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  const hasFilters = status !== "ALL" || query.length > 0;

  return (
    <>
      <PageHeader
        eyebrow="Audit ledger · preview"
        title="Every thesis"
        accent="on the record."
        description="Owner-scoped audit records with explicit lifecycle state. Filters below operate on the deterministic fixture set only."
        actions={
          <Link href="/app/audits/new" className="button button--primary">
            <Plus size={15} aria-hidden="true" />
            New audit
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FixtureBadge />
        <span className="tag tag--muted">{audits.length} records</span>
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
                placeholder="Title, public ID or asset"
                className="input pl-9"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="audit-status">Status</label>
            <select id="audit-status" name="status" defaultValue={status} className="select">
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
                <caption className="sr-only">Filtered demo audits</caption>
                <thead>
                  <tr>
                    <th scope="col">Audit</th>
                    <th scope="col">Action</th>
                    <th scope="col">Status</th>
                    <th scope="col">Verdict</th>
                    <th scope="col">Conditions</th>
                    <th scope="col">Updated</th>
                    <th scope="col" aria-label="Open audit" />
                  </tr>
                </thead>
                <tbody>
                  {audits.map((audit) => (
                    <tr key={audit.id}>
                      <td data-label="Audit">
                        <div className="table-primary">
                          <Link href={`/app/audits/${audit.id}`}>{audit.title}</Link>
                          <span>
                            {audit.publicId} · {audit.asset} · {audit.venue}
                          </span>
                        </div>
                      </td>
                      <td data-label="Action">
                        <span className="mono text-[10px]">{audit.action}</span>
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
                      <td data-label="Conditions">
                        <span className="mono text-[10px]">{audit.conditionCount}</span>
                      </td>
                      <td data-label="Updated">
                        <span className="mono text-[10px] text-muted-2">
                          {audit.updatedAt.replace("T", " ").replace("Z", " UTC")}
                        </span>
                      </td>
                      <td data-label="Open">
                        <Link
                          href={`/app/audits/${audit.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-primary"
                        >
                          Open
                          <ArrowRight size={12} aria-hidden="true" />
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
                <Search size={20} aria-hidden="true" />
              </span>
              <h2 className="empty-title">No audits match those filters.</h2>
              <p className="empty-copy">
                Clear the filters or create a new audit. A missing result is not treated as a safe
                thesis.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/app/audits" className="button button--primary">
                  Clear filters
                </Link>
                <Link href="/app/audits/new" className="button button--ghost">
                  New audit
                </Link>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}
