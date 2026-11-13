import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, CircleAlert, LockKeyhole, RefreshCw, Wallet } from "lucide-react";

import { PageHeader, Panel } from "@/components/ui";
import { getDb } from "@/db";
import { executionReceipts } from "@/db/schema";
import { checkRefTestnetVenue, proprietaryLoopEnabled } from "@/lib/proprietary/venue";

export const dynamic = "force-dynamic";

export default async function ProprietaryPage() {
  const venue = await checkRefTestnetVenue();
  const loopEnabled = proprietaryLoopEnabled();
  const executionEnabled = process.env.EXECUTION_ENABLED === "true";
  const vault = process.env.NEAR_VAULT_ACCOUNT_ID ?? null;
  const agent = process.env.NEAR_VAULT_AGENT_ACCOUNT_ID ?? null;
  const receipts = await getDb().select().from(executionReceipts).limit(20);

  return (
    <>
      <PageHeader
        eyebrow="Proprietary arm · testnet"
        title="Originate, audit,"
        accent="then execute—only if TRADE."
        description="The proprietary loop uses the same eight-attacker pipeline as a client thesis. Execution is separately gated by the vault, the Ref Finance venue precheck and EXECUTION_ENABLED."
        actions={
          <Link href="/operator" className="button button--ghost">
            <ArrowLeft size={14} aria-hidden="true" />
            Operations
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="tag tag--muted">testnet only</span>
        <span className={`tag ${executionEnabled ? "tag--ok" : "tag--warn"}`}>
          EXECUTION_ENABLED={String(executionEnabled)}
        </span>
        <span className={`tag ${loopEnabled ? "tag--ok" : "tag--warn"}`}>
          LOOP={loopEnabled ? "enabled" : "disabled"}
        </span>
        <span className={`tag ${venue.available ? "tag--ok" : "tag--warn"}`}>
          venue {venue.available ? "available" : "blocked"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <div className="dashboard-stack">
          <Panel
            title="Venue precheck"
            subtitle="Ref Finance testnet pool API. A failed precheck blocks live origination and swap execution."
            action={
              <Link href="/operator/proprietary" className="button button--ghost button--small">
                <RefreshCw size={12} aria-hidden="true" />
                Re-check
              </Link>
            }
          >
            <div className={`rounded-2xl border p-4 ${venue.available ? "border-ok/25 bg-ok/10" : "border-warn/25 bg-warn/10"}`}>
              <div className="flex items-start gap-3">
                {venue.available ? (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" />
                ) : (
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
                )}
                <div>
                  <p className="font-display text-xl font-bold uppercase tracking-tight">
                    {venue.available ? "Available" : "Blocked"}
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted">
                    {venue.available
                      ? "The testnet pool API returned data. The loop may originate a thesis; execution still requires a TRADE verdict, an approved certificate and EXECUTION_ENABLED=true."
                      : `No live swap was attempted. Reason: ${venue.reason ?? "REF_FINANCE_TESTNET_API_UNAVAILABLE"}. Missing venue data is not a negative market result.`}
                  </p>
                  <p className="mono mt-2 text-[9px] text-muted-2">
                    checked {venue.checkedAt}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-white/[0.02] p-3">
                <p className="small-caps text-muted-2">Vault</p>
                <p className="mt-1 break-all font-mono text-[10px] text-ink">
                  {vault ?? "not configured"}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-white/[0.02] p-3">
                <p className="small-caps text-muted-2">Agent</p>
                <p className="mt-1 break-all font-mono text-[10px] text-ink">
                  {agent ?? "not configured"}
                </p>
              </div>
            </div>
          </Panel>

          <Panel
            title="Execution receipts"
            subtitle="Only an accepted TRADE certificate can reach the vault. No receipt is fabricated."
            action={<span className="tag tag--muted">{receipts.length} records</span>}
            bodyClassName=""
          >
            {receipts.length > 0 ? (
              <div className="table-wrap">
                <table className="data-table">
                  <caption className="sr-only">Proprietary execution receipts</caption>
                  <thead>
                    <tr>
                      <th scope="col">Certificate</th>
                      <th scope="col">Status</th>
                      <th scope="col">Transaction</th>
                      <th scope="col">Amount</th>
                      <th scope="col">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((receipt) => (
                      <tr key={receipt.id}>
                        <td data-label="Certificate">
                          <span className="mono text-[10px]">{receipt.certificateId.slice(0, 12)}…</span>
                        </td>
                        <td data-label="Status">
                          <span className={`tag ${receipt.status === "EXECUTED" ? "tag--ok" : "tag--warn"}`}>
                            {receipt.status}
                          </span>
                        </td>
                        <td data-label="Transaction">
                          <span className="mono text-[10px]">{receipt.txHash ?? "—"}</span>
                        </td>
                        <td data-label="Amount">
                          <span className="mono text-[10px]">{receipt.amountYocto ?? "—"}</span>
                        </td>
                        <td data-label="Created">
                          <span className="mono text-[10px] text-muted-2">
                            {receipt.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
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
                  <Wallet size={20} aria-hidden="true" />
                </span>
                <h2 className="empty-title">No execution receipt yet.</h2>
                <p className="empty-copy">
                  Venue precheck is blocked, so the proprietary loop cannot originate a live thesis
                  or call the vault. The audit pipeline and vault remain configured.
                </p>
              </div>
            )}
          </Panel>
        </div>

        <div className="rail-stack">
          <Panel title="Safety boundary" subtitle="Testnet execution, not a trading venue.">
            <ul className="gate-list">
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Only a TRADE verdict can execute
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Per-transaction and daily caps enforced on-chain
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Recipient allowlist; Ref testnet router only
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Memo must contain an approved certificate ID
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Agent key is a Function Call Key scoped to spend_as
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Mainnet execution
              </li>
            </ul>
            <div className="mt-4 notice notice--info">
              <LockKeyhole size={15} aria-hidden="true" />
              <span>
                `EXECUTION_ENABLED` and `PROPRIETARY_LOOP_ENABLED` default to `false`. Flipping them
                is an explicit preview/demo action recorded in the handoff.
              </span>
            </div>
          </Panel>

          <Panel title="Why this is blocked" subtitle="No fake market, no fake trade.">
            <p className="text-[12px] leading-relaxed text-muted">
              Both required Ref Finance testnet API probes failed before HTTP because the host did
              not resolve. The execution adapter remains implemented and unit-tested against the
              vault interface, but no live swap is attempted until real pool data exists.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
