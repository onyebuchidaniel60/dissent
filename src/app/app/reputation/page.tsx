import Link from "next/link";
import { ArrowRight, BarChart3, CircleAlert, Scale, ShieldCheck, Users } from "lucide-react";

import { FixtureBadge } from "@/components/fixture-badge";
import { KpiCard, PageHeader, Panel } from "@/components/ui";

export default function ReputationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reputation ledger · preview"
        title="Quality is derived,"
        accent="not claimed."
        description="Reputation events are written once from finalized accepted and rejected finding records. The preview has no finalized live audits, so the ledger is intentionally empty."
        actions={
          <Link href="/docs#reputation" className="button button--ghost">
            Read the reputation rules
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FixtureBadge />
        <span className="tag tag--muted">No finalized live audits</span>
      </div>

      <div className="stat-grid">
        <KpiCard
          label="Finalized audits"
          value="0"
          detail="No reputation events can be written yet"
          icon={<ShieldCheck size={14} aria-hidden="true" />}
        />
        <KpiCard
          label="Accepted findings"
          value="0"
          detail="Only accepted findings affect quality"
          icon={<Scale size={14} aria-hidden="true" />}
        />
        <KpiCard
          label="Rejected findings"
          value="0"
          detail="False positives are tracked, not hidden"
          icon={<CircleAlert size={14} aria-hidden="true" />}
        />
        <KpiCard
          label="Attackers tracked"
          value="8"
          detail="Frozen A01–A08 identities"
          icon={<Users size={14} aria-hidden="true" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Attacker quality ledger"
          subtitle="Rates are only shown after finalization; the preview does not invent precision."
          bodyClassName=""
        >
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Attacker reputation metrics</caption>
              <thead>
                <tr>
                  <th scope="col">Attacker</th>
                  <th scope="col">Accepted</th>
                  <th scope="col">Rejected</th>
                  <th scope="col">Precision</th>
                  <th scope="col">Last event</th>
                </tr>
              </thead>
              <tbody>
                {["A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08"].map((attacker) => (
                  <tr key={attacker}>
                    <td data-label="Attacker">
                      <span className="mono text-primary">{attacker}</span>
                    </td>
                    <td data-label="Accepted">
                      <span className="mono text-[10px] text-muted-2">—</span>
                    </td>
                    <td data-label="Rejected">
                      <span className="mono text-[10px] text-muted-2">—</span>
                    </td>
                    <td data-label="Precision">
                      <span className="mono text-[10px] text-muted-2">Not computed</span>
                    </td>
                    <td data-label="Last event">
                      <span className="mono text-[10px] text-muted-2">None</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line p-4">
            <div className="notice notice--info">
              <BarChart3 size={15} aria-hidden="true" />
              <span>
                A dash is not zero performance. It means no finalized event exists. The ledger will
                be populated by the idempotent reputation service in Phase 5.
              </span>
            </div>
          </div>
        </Panel>

        <div className="rail-stack">
          <Panel title="How reputation is earned" subtitle="No self-reported scores.">
            <ol className="mt-1 grid gap-4">
              {[
                ["Finalized finding", "Only accepted or rejected records after certificate finalization count."],
                ["Evidence support", "A claim without verified support does not become a quality event."],
                ["Novelty", "Section B restatements are rejected and do not earn credit."],
                ["Idempotency", "The unique event key prevents double-counting on replay."],
              ].map(([label, copy], index) => (
                <li key={label} className="flex gap-3">
                  <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-red text-[10px] text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[12px] font-extrabold text-ink">{label}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">{copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Why the ledger is empty" subtitle="Honest state, not a fake chart.">
            <p className="text-[12px] leading-relaxed text-muted">
              The preview contains deterministic fixtures for layout review. Fixture outcomes are
              not written to the reputation ledger, and no fixture is presented as a live model
              result.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
