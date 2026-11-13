import Link from "next/link";
import { ArrowLeft, CircleAlert, ExternalLink, Fingerprint, SearchCheck, ShieldCheck } from "lucide-react";

import { FixtureBadge } from "@/components/fixture-badge";
import { PageHeader, Panel } from "@/components/ui";

const DEMO_CERTIFICATE_HASH =
  "7c0f4e5d2b8a1c9f6e3d0b7a4c1f8e5d2a9b6c3f0e7d4a1b8c5f2e9d6a3b0c7f";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;

  return (
    <div className="page-width app-main">
      <PageHeader
        eyebrow="Public verifier · preview"
        title="Check the record,"
        accent="not the narrative."
        description="The public verifier is intentionally read-only. It will recompute the certificate hash from canonical bytes and compare it with the NEAR registry record."
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
        <FixtureBadge />
        <span className="tag tag--muted">{certificateId}</span>
        <span className="tag tag--warn">Verification unavailable</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
        <Panel
          title="Registry lookup"
          subtitle="Testnet registry integration lands in Phase 3. No chain call is faked here."
          action={<SearchCheck size={17} className="text-warn" aria-hidden="true" />}
        >
          <div className="stack-md">
            <div className="rounded-2xl border border-warn/25 bg-warn/10 p-4">
              <div className="flex items-start gap-3">
                <CircleAlert size={18} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
                <div>
                  <p className="font-display text-xl font-bold uppercase tracking-tight text-warn">
                    NOT_FOUND
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted">
                    This certificate identifier is a deterministic preview fixture. It has not been
                    finalized or anchored on NEAR testnet, so the verifier cannot return VERIFIED.
                  </p>
                </div>
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ["Certificate ID", certificateId],
                ["Verdict", "ABSTAIN"],
                ["Policy version", "dissent-adjudication-v1.0"],
                ["Network", "NEAR testnet"],
                ["Registry account", "Not deployed"],
                ["Anchor transaction", "None"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-line bg-white/[0.02] p-3">
                  <dt className="small-caps text-muted-2">{label}</dt>
                  <dd className="mt-1 font-mono text-[10px] text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="hash-box">
              <span className="hash-label">Fixture certificate hash</span>
              <span className="hash-value">{DEMO_CERTIFICATE_HASH}</span>
              <span className="text-[10px] leading-relaxed text-muted-2">
                Displayed for layout testing only. A future verifier recomputes the hash from
                canonical certificate bytes and compares it with the registry.
              </span>
            </div>
          </div>
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
                The verifier will never expose the thesis preimage, positions, private evidence,
                attacker prompts or client identifiers.
              </span>
            </div>
          </Panel>

          <Panel title="Public boundary" subtitle="Why this page is safe to share.">
            <p className="text-[12px] leading-relaxed text-muted">
              A public record contains only the certificate hash, verdict, policy version, registry
              account and transaction reference. The underlying thesis remains workspace-private
              unless the client explicitly publishes a redacted artifact.
            </p>
            <Link href="/docs#security" className="button button--ghost button--small mt-4">
              Read the security model
            </Link>
          </Panel>
        </div>
      </div>
    </div>
  );
}
