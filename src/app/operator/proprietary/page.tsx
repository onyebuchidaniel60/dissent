import Link from "next/link";
import { desc } from "drizzle-orm";
import { AlertTriangle, ArrowLeft, CheckCircle2, CircleAlert, LockKeyhole, RefreshCw, Wallet } from "lucide-react";

import { PageHeader, Panel } from "@/components/ui";
import { getDb } from "@/db";
import { executionReceipts } from "@/db/schema";
import { executionVenue } from "@/lib/network";
import { checkExecutionVenue, proprietaryLoopEnabled } from "@/lib/proprietary/venue";

export const dynamic = "force-dynamic";

function displayAccount(accountId: string | null): string {
  if (!accountId) return "not configured";
  const parts = accountId.split(".");
  return parts.length > 2 ? `${parts[0]}.${parts[1]}` : parts[0];
}

export default async function ProprietaryPage() {
  const venue = await checkExecutionVenue();
  const loopEnabled = proprietaryLoopEnabled();
  const executionEnabled = process.env.EXECUTION_ENABLED === "true";
  const vaultSupportsNep141 = process.env.VAULT_SUPPORTS_NEP141 === "true";
  const vault = process.env.NEAR_VAULT_ACCOUNT_ID ?? null;
  const agent = process.env.NEAR_VAULT_AGENT_ACCOUNT_ID ?? null;
  const configuredVenue = executionVenue();
  const accountsConfigured = Boolean(
    process.env.PROPRIETARY_RECIPIENT &&
      (process.env.PROPRIETARY_REFUND_TO || process.env.NEAR_VAULT_ACCOUNT_ID),
  );
  const receipts = await getDb()
    .select()
    .from(executionReceipts)
    .orderBy(desc(executionReceipts.createdAt))
    .limit(20);
  const latestReceipt = receipts[0];
  const executed = latestReceipt?.status === "EXECUTED";

  return (
    <>
      <PageHeader
        eyebrow="Proprietary arm · production"
        title="Originate. Audit."
        accent="Execute only on TRADE."
        description="The proprietary loop uses the same eight-attacker pipeline as a client thesis. Execution is separately gated by the vault, the configured execution venue and EXECUTION_ENABLED."
        actions={
          <Link href="/operator" className="button button--ghost">
            <ArrowLeft size={14} aria-hidden="true" />
            Operations
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="tag tag--muted">guarded execution</span>
        <span className={`tag ${executionEnabled ? "tag--ok" : "tag--warn"}`}>
          EXECUTION_ENABLED={String(executionEnabled)}
        </span>
        <span className={`tag ${loopEnabled ? "tag--ok" : "tag--warn"}`}>
          LOOP={loopEnabled ? "enabled" : "disabled"}
        </span>
        <span className={`tag ${venue.available ? "tag--ok" : "tag--warn"}`}>
          venue {venue.available ? "available" : "blocked"}
        </span>
        <span className={`tag ${vaultSupportsNep141 ? "tag--ok" : "tag--warn"}`}>
          vault {vaultSupportsNep141 ? "NEP-141" : "native-only"}
        </span>
        <span className={`tag ${accountsConfigured ? "tag--ok" : "tag--warn"}`}>
          quote accounts {accountsConfigured ? "configured" : "missing"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <div className="dashboard-stack">
          <Panel
            title="Venue precheck"
            subtitle={`${configuredVenue === "TIDEPOOL" ? "Tidepool" : "1Click"} quote/tokens precheck. A failed precheck blocks live origination and swap execution.`}
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
                      ? `${configuredVenue === "TIDEPOOL" ? "Tidepool" : "1Click"} returned token and quote data. Execution still requires a TRADE verdict, an approved certificate, an allowlisted quote deposit address and EXECUTION_ENABLED=true.`
                      : `No live swap was attempted. Reason: ${venue.reason ?? `${configuredVenue}_UNAVAILABLE`}. Missing venue data is not a negative market result.`}
                  </p>
                  {!accountsConfigured ? (
                    <p className="mt-2 text-[10px] leading-relaxed text-warn">
                      Add PROPRIETARY_RECIPIENT and PROPRIETARY_REFUND_TO to form a live quote.
                    </p>
                  ) : null}
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
                  {displayAccount(vault)}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-white/[0.02] p-3">
                <p className="small-caps text-muted-2">Agent</p>
                <p className="mt-1 break-all font-mono text-[10px] text-ink">
                  {displayAccount(agent)}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-white/[0.02] p-3 sm:col-span-2">
                <p className="small-caps text-muted-2">Execution asset</p>
                <p className="mt-1 break-all font-mono text-[10px] text-ink">
                  wNEAR · {vaultSupportsNep141 ? "spend_ft_as enabled" : "NEP-141 support not configured"}
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
                      <th scope="col">Note</th>
                      <th scope="col">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((receipt) => (
                      <tr key={receipt.id}>
                        <td data-label="Certificate">
                          <Link
                            href={`/verify/${receipt.certificateId}`}
                            className="mono min-w-0 break-all text-[10px] underline decoration-line underline-offset-2 hover:text-ink"
                          >
                            {receipt.certificateId.slice(0, 12)}…
                          </Link>
                        </td>
                        <td data-label="Status">
                          <span className={`tag ${receipt.status === "EXECUTED" ? "tag--ok" : "tag--warn"}`}>
                            {receipt.status}
                          </span>
                        </td>
                        <td data-label="Transaction">
                          <span className="mono min-w-0 break-all text-[10px]">{receipt.txHash ?? "—"}</span>
                        </td>
                        <td data-label="Amount">
                          <span className="mono text-[10px]">{receipt.amountYocto ?? "—"}</span>
                        </td>
                        <td data-label="Note">
                          <span className="mono min-w-0 max-w-[18ch] break-all text-right text-[9px] text-muted">
                            {receipt.reason?.includes("SUCCESS")
                              ? "Settled"
                              : receipt.reason ?? "—"}
                          </span>
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
                  No execution receipt yet. The loop originates only from a live venue quote;
                  a TRADE certificate, an approved quote deposit address and a NEP-141-capable
                  vault are required before the agent can call `spend_ft_as`.
                </p>
              </div>
            )}
          </Panel>
        </div>

        <div className="rail-stack">
          <Panel title="Safety boundary" subtitle="Guarded execution, not a trading venue.">
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
                Recipient allowlist; venue quote deposit address only
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Memo must contain an approved certificate ID
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Agent key is a Function Call Key scoped to spend_as and spend_ft_as
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Vault token contract fixed to wNEAR at initialization
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Unapproved recipient or token contract
              </li>
            </ul>
            <div className="mt-4 notice notice--info">
              <LockKeyhole size={15} aria-hidden="true" />
              <span>
                `EXECUTION_ENABLED` and `PROPRIETARY_LOOP_ENABLED` default to `false`. Flipping them
                is an explicit operator action recorded in the handoff.
              </span>
            </div>
          </Panel>

          <Panel
            title={executed ? "Execution path" : "Awaiting execution"}
            subtitle={executed ? "A real vault transfer, not a simulated trade." : "No fake market, no fake trade."}
          >
            {executed && latestReceipt ? (
              <div className="space-y-3">
                <p className="text-[12px] leading-relaxed text-muted">
                  The vault executed `spend_ft_as` for the approved quote deposit address. The
                  certificate is bound to the same certificate ID and records the vault transaction.
                </p>
                <p className="break-all font-mono text-[10px] text-ink">
                  vault tx: {latestReceipt.txHash ?? "—"}
                </p>
                <p className="break-all font-mono text-[10px] text-muted">
                  certificate: {latestReceipt.certificateId}
                </p>
                <Link
                  href={`/verify/${latestReceipt.certificateId}`}
                  className="button button--ghost button--small"
                >
                  Open certificate verifier
                </Link>
              </div>
            ) : (
              <p className="text-[12px] leading-relaxed text-muted">
                The proprietary loop can originate a live quote, but no vault transfer is attempted
                until the audit returns TRADE, the certificate and quote deposit address are
                approved on-chain, and the vault reports a NEP-141 balance. A failed check is
                `NOT_CONFIGURED` or `REVERTED`, never a simulated trade.
              </p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
