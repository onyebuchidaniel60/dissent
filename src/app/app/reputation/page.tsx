import Link from "next/link";
import { ArrowRight, BarChart3, CircleAlert, Scale, ShieldCheck, Users } from "lucide-react";

import { KpiCard, PageHeader, Panel } from "@/components/ui";

export default function ReputationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reputation ledger"
        title="Quality is derived,"
        accent="not claimed."
        description="Reputation events are written from finalized accepted and rejected findings. The ledger remains empty until a finalized audit exists."
        actions={
          <Link href="/docs#reputation" className="button button--ghost">
            Read the reputation rules
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="tag tag--muted">Awaiting first finalized audit</span>
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
          subtitle="Rates are only shown after finalization; no precision is invented."
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
                A dash is not zero performance. It means no finalized event exists. The ledger is populated
                by the idempotent reputation service after certificate finalization.
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

          <Panel title="Empty until finalization" subtitle="Honest state, not a synthetic score.">
            <p className="text-[12px] leading-relaxed text-muted">
              No audit has been finalized in this workspace, so the ledger is empty. The service
              never writes a reputation event from an unfinished run or a fixture.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
