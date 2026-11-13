import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Fingerprint,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";

import { FixtureBadge } from "@/components/fixture-badge";
import { StatusPill } from "@/components/status-pill";
import { PageHeader, Panel } from "@/components/ui";
import { getCertificateView } from "@/lib/certificates";

const DEMO_CERTIFICATE_HASH =
  "7c0f4e5d2b8a1c9f6e3d0b7a4c1f8e5d2a9b6c3f0e7d4a1b8c5f2e9d6a3b0c7f";

function value(record: Record<string, unknown>, key: string): string {
  const v = record[key];
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const view = await getCertificateView(certificateId).catch(() => null);
  const isFixture = certificateId === "DEMO-CERT-001";
  const verified =
    Boolean(view) && view!.hashMatches && view!.chainHashMatches && view!.anchorStatus === "ANCHORED";

  return (
    <div className="page-width app-main">
      <PageHeader
        eyebrow="Public verifier"
        title="Check the record,"
        accent="not the narrative."
        description="The verifier recomputes the certificate hash from canonical bytes and compares it with the NEAR testnet registry. It never exposes the thesis preimage, positions, evidence payloads or attacker prompts."
        actions={
          <>
            <Link href="/app" className="button button--ghost">
              <ArrowLeft size={14} aria-hidden="true" />
              Console
            </Link>
            <Link href="/docs#certificates" className="button button--primary">
              How verification works
              <ExternalLink size={14} aria-hidden="true" />
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {isFixture ? <FixtureBadge /> : null}
        <span className="tag tag--muted">{certificateId}</span>
        {view ? (
          <>
            <StatusPill status={view.anchorStatus} />
            <span className={`tag ${verified ? "tag--ok" : "tag--warn"}`}>
              {verified ? "VERIFIED" : view.hashMatches ? "MISMATCH" : "NOT_FOUND"}
            </span>
          </>
        ) : (
          <span className="tag tag--warn">NOT_FOUND</span>
        )}
      </div>

      {!view ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
          <Panel
            title="Registry lookup"
            subtitle="No certificate with this ID exists in the preview database."
            action={<SearchCheck size={17} className="text-warn" aria-hidden="true" />}
          >
            <div className="rounded-2xl border border-warn/25 bg-warn/10 p-4">
              <div className="flex items-start gap-3">
                <CircleAlert size={18} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
                <div>
                  <p className="font-display text-xl font-bold uppercase tracking-tight text-warn">
                    NOT_FOUND
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted">
                    {isFixture
                      ? "This is the deterministic preview fixture identifier. It has not been anchored on NEAR testnet, so the verifier cannot return VERIFIED."
                      : "No matching certificate was found. A missing record is not a safe result; do not treat it as a successful audit."}
                  </p>
                </div>
              </div>
            </div>
            {isFixture ? (
              <div className="hash-box mt-4">
                <span className="hash-label">Fixture certificate hash</span>
                <span className="hash-value">{DEMO_CERTIFICATE_HASH}</span>
              </div>
            ) : null}
          </Panel>

          <div className="rail-stack">
            <Panel title="What will be verified" subtitle="Public fields only.">
              <ul className="gate-list">
                <li className="gate" data-pass="false">
                  <Fingerprint aria-hidden="true" />
                  Canonical JSON hash matches the registry
                </li>
                <li className="gate" data-pass="false">
                  <Fingerprint aria-hidden="true" />
                  Registry transaction is finalized
                </li>
                <li className="gate" data-pass="false">
                  <Fingerprint aria-hidden="true" />
                  Policy version matches the commitment
                </li>
                <li className="gate" data-pass="false">
                  <Fingerprint aria-hidden="true" />
                  Verdict is one of TRADE / REFUSE / ABSTAIN
                </li>
              </ul>
              <div className="mt-4 notice notice--info">
                <ShieldCheck size={15} aria-hidden="true" />
                <span>
                  The verifier never exposes private thesis, portfolio or evidence fields.
                </span>
              </div>
            </Panel>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
          <Panel
            title="Verification result"
            subtitle="Server-side recomputation plus the NEAR testnet registry record."
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
                {verified ? "VERIFIED" : "MISMATCH"}
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                {verified
                  ? "The recomputed SHA-256 matches the stored certificate and the finalized registry record."
                  : "The recomputed hash or the registry record does not match the stored certificate. Do not rely on this record."}
              </p>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Certificate ID", view.id],
                ["Audit", value(view.publicCertificate, "public_audit_id")],
                ["Verdict", view.chainVerdict ?? value(view.publicCertificate, "verdict")],
                ["Policy version", value(view.publicCertificate, "policy_version")],
                ["Anchor status", view.anchorStatus],
                ["Network", value(view.publicCertificate, "network")],
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
                href={`https://explorer.testnet.near.org/transactions/${view.chainTxHash}`}
                className="button button--ghost button--small mt-4"
                target="_blank"
                rel="noreferrer"
              >
                View registry transaction
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            ) : null}
          </Panel>

          <div className="rail-stack">
            <Panel title="Registry record" subtitle="NEAR testnet · public fields.">
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
                <span>Network</span>
                <strong>testnet</strong>
              </div>
              {view.execution ? (
                <>
                  <div className="rail-row">
                    <span>Execution readiness</span>
                    <strong className={view.execution.status === "EXECUTED" ? "text-ok" : "text-warn"}>
                      {value(view.execution, "status")}
                    </strong>
                  </div>
                  <div className="rail-row">
                    <span>Venue</span>
                    <strong>{value(view.execution, "venue")}</strong>
                  </div>
                  <div className="rail-row">
                    <span>Tidepool status</span>
                    <strong>{value(view.execution, "tidepool_status")}</strong>
                  </div>
                  <div className="rail-row">
                    <span>Execution tx</span>
                    <strong className="break-all font-mono text-[9px]">
                      {value(view.execution, "tx_hash")}
                    </strong>
                  </div>
                  {Array.isArray(view.execution.tidepool_swap_tx_hashes) &&
                  view.execution.tidepool_swap_tx_hashes.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      <p className="small-caps text-muted-2">Tidepool swap transactions</p>
                      {view.execution.tidepool_swap_tx_hashes.map((hash) => (
                        <a
                          key={String(hash)}
                          href={`https://explorer.testnet.near.org/transactions/${String(hash)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block break-all font-mono text-[9px] text-ok underline decoration-line underline-offset-2"
                        >
                          {String(hash)}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </Panel>

            <Panel title="Public boundary" subtitle="Why this page is safe to share.">
              <p className="text-[12px] leading-relaxed text-muted">
                Only the certificate hash, verdict, policy version, registry account and
                transaction reference are public. Thesis preimages, positions, prompts and evidence
                payloads remain private.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="tag tag--ok">hash recomputed</span>
                <span className="tag tag--muted">no private fields</span>
                <span className="tag tag--warn">TEE waived</span>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
