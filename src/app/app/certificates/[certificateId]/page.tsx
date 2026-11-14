import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CircleAlert, ExternalLink, Fingerprint, ShieldCheck } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { PageHeader, Panel } from "@/components/ui";
import { getCertificateView } from "@/lib/certificates";
import { explorerTxUrl } from "@/lib/network";

export const dynamic = "force-dynamic";

function value(record: Record<string, unknown>, key: string): string {
  const item = record[key];
  if (item === null || item === undefined) return "—";
  if (typeof item === "object") return JSON.stringify(item);
  return String(item);
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const view = await getCertificateView(certificateId).catch(() => null);
  if (!view) notFound();

  const verified = view.hashMatches && view.chainHashMatches && view.anchorStatus === "ANCHORED";
  const execution = view.execution;

  return (
    <>
      <PageHeader
        eyebrow="Certificate"
        title="The record is"
        accent={view.id.slice(0, 12)}
        description="Canonical certificate hash, registry anchor and the public execution record. Private thesis and evidence preimages are not exposed."
        actions={
          <>
            <Link href={`/app/audits/${view.auditId}`} className="button button--ghost">
              Open audit
            </Link>
            <Link href={`/verify/${view.id}`} className="button button--primary">
              Public verifier
              <ExternalLink size={14} aria-hidden="true" />
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusPill status={view.anchorStatus} />
        <span className={`tag ${verified ? "tag--ok" : "tag--warn"}`}>
          {verified ? "VERIFIED" : "CHECK FAILED"}
        </span>
        <span className="tag tag--muted">{view.publicCertificate.public_audit_id as string}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
        <div className="dashboard-stack">
          <Panel
            title="Verification result"
            subtitle="Server-side hash recomputation plus the NEAR registry record."
            action={
              verified ? (
                <CheckCircle2 size={18} className="text-ok" aria-hidden="true" />
              ) : (
                <CircleAlert size={18} className="text-warn" aria-hidden="true" />
              )
            }
          >
            <div className={`rounded-2xl border p-4 ${verified ? "border-ok/25 bg-ok/10" : "border-warn/25 bg-warn/10"}`}>
              <p className={`font-display text-2xl font-bold uppercase tracking-tight ${verified ? "text-ok" : "text-warn"}`}>
                {verified ? "VERIFIED" : "CHECK FAILED"}
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                {verified
                  ? "The recomputed SHA-256 matches the stored certificate and the finalized registry record."
                  : "The recomputed hash or the registry record does not match. Do not rely on this record."}
              </p>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Certificate ID", view.id],
                ["Audit", value(view.publicCertificate, "public_audit_id")],
                ["Verdict", view.chainVerdict ?? value(view.publicCertificate, "verdict")],
                ["Policy", value(view.publicCertificate, "policy_version")],
                ["Network", "NEAR"],
                ["Execution", value(view.publicCertificate, "execution_readiness")],
              ].map(([label, text]) => (
                <div key={label} className="rounded-xl border border-line bg-white/[0.02] p-3">
                  <dt className="small-caps text-muted-2">{label}</dt>
                  <dd className="mt-1 break-all font-mono text-[10px] text-ink">{text}</dd>
                </div>
              ))}
            </dl>

            <div className="hash-box mt-4">
              <span className="hash-label">Stored certificate hash</span>
              <span className="hash-value">{view.storedHash}</span>
              <span className="hash-label mt-3">Recomputed hash</span>
              <span className={`hash-value ${view.hashMatches ? "text-ok" : "text-danger"}`}>
                {view.recomputedHash}
              </span>
            </div>

            {view.chainTxHash ? (
              <a
                href={explorerTxUrl(view.chainTxHash)}
                className="button button--ghost button--small mt-4"
                target="_blank"
                rel="noreferrer"
              >
                View registry transaction
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            ) : null}
          </Panel>

          <Panel title="Coverage" subtitle="Committed conditions and review outcome.">
            <div className="grid gap-3 sm:grid-cols-3">
              {(() => {
                const summary = (view.publicCertificate.coverage_summary ?? {}) as Record<string, unknown>;
                return ([
                  ["Conditions", summary.conditions ?? "—"],
                  ["Accepted findings", summary.accepted_findings ?? "—"],
                  ["Minority findings", summary.minority_findings ?? "—"],
                ] as Array<[string, unknown]>).map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-line bg-white/[0.02] p-3">
                    <p className="small-caps text-muted-2">{label}</p>
                    <p className="mt-1 font-display text-xl font-bold text-ink">{String(value)}</p>
                  </div>
                ));
              })()}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              The complete coverage matrix is preserved in the certificate body. The public
              certificate exposes the aggregate counts; private evidence remains server-side.
            </p>
          </Panel>
        </div>

        <aside className="rail-stack">
          <Panel title="Registry record" subtitle="Public fields only.">
            <div className="rail-row">
              <span>Certificate hash</span>
              <strong className={view.chainHashMatches ? "text-ok" : "text-danger"}>
                {view.chainHashMatches ? "match" : "mismatch"}
              </strong>
            </div>
            <div className="rail-row">
              <span>Verdict</span>
              <strong>{view.chainVerdict ?? "—"}</strong>
            </div>
            <div className="rail-row">
              <span>Policy hash</span>
              <strong className="break-all">{view.chainRecord?.policy_hash ?? "—"}</strong>
            </div>
            <div className="rail-row">
              <span>Finalized block</span>
              <strong>{view.chainRecord?.finalized_at_block_height ?? "—"}</strong>
            </div>
            <div className="rail-row">
              <span>Anchor status</span>
              <strong>{view.anchorStatus}</strong>
            </div>
          </Panel>

          {execution ? (
            <Panel title="Execution" subtitle="Capped vault and venue settlement.">
              <div className="rail-row">
                <span>Status</span>
                <strong className={value(execution, "status") === "EXECUTED" ? "text-ok" : "text-warn"}>
                  {value(execution, "status")}
                </strong>
              </div>
              <div className="rail-row">
                <span>Venue</span>
                <strong>{String(value(execution, "venue")).replace("_TESTNET", "").replace("ONECLICK_MAINNET", "ONECLICK")}</strong>
              </div>
              <div className="rail-row">
                <span>Vault transaction</span>
                <strong className="break-all font-mono text-[9px]">{value(execution, "tx_hash")}</strong>
              </div>
              <div className="rail-row">
                <span>Venue status</span>
                <strong>{value(execution, "tidepool_status")}</strong>
              </div>
            </Panel>
          ) : null}

          <Panel title="Disclosure" subtitle="What is not public.">
            <p className="text-[12px] leading-relaxed text-muted">
              The thesis preimage, positions, evidence payloads and attacker prompts are not
              published. The verifier exposes only the fields needed to reproduce the certificate
              hash and registry anchor.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-2">
              <Fingerprint size={13} aria-hidden="true" />
              RFC 8785 canonical JSON · SHA-256
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-2">
              <ShieldCheck size={13} aria-hidden="true" />
              No majority vote · policy v1.0
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}
