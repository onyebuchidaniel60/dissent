import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Fingerprint,
  GitCommitHorizontal,
  ShieldCheck,
} from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import { FixtureBadge } from "@/components/fixture-badge";
import { StatusPill } from "@/components/status-pill";
import { PageHeader, Panel } from "@/components/ui";
import { DEMO_AUDITS, DEMO_FINDINGS } from "@/lib/demo-data";

const DEMO_CERTIFICATE_HASH =
  "7c0f4e5d2b8a1c9f6e3d0b7a4c1f8e5d2a9b6c3f0e7d4a1b8c5f2e9d6a3b0c7f";

export const dynamic = "force-dynamic";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  if (certificateId !== "DEMO-CERT-001") notFound();

  const audit = DEMO_AUDITS[0];
  const accepted = DEMO_FINDINGS.filter((finding) => finding.review === "ACCEPTED");

  return (
    <>
      <PageHeader
        eyebrow="Certificate · preview fixture"
        title="A record that"
        accent="can be checked."
        description="The certificate preserves the verdict, coverage table, accepted findings, minority findings and policy version. The preview does not pretend this hash is anchored."
        actions={
          <>
            <Link href={`/app/audits/${audit.id}/results`} className="button button--ghost">
              <ArrowLeft size={14} aria-hidden="true" />
              Result surface
            </Link>
            <Link href="/verify/DEMO-CERT-001" className="button button--primary">
              Public verify
              <ExternalLink size={14} aria-hidden="true" />
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FixtureBadge />
        <span className="tag tag--muted">DEMO-CERT-001</span>
        <span className="tag tag--warn">Anchor pending · Phase 5</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <Panel
          title="Certificate body"
          subtitle="Canonical JSON will be hashed with SHA-256 and registered on the testnet registry."
          action={<Fingerprint size={16} className="text-primary" aria-hidden="true" />}
        >
          <div className="stack-md">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="small-caps text-muted-2">Protocol verdict</p>
                <p className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-warn">
                  ABSTAIN
                </p>
              </div>
              <StatusPill status="ABSTAIN" />
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ["Audit", audit.publicId],
                ["Policy", "dissent-adjudication-v1.0"],
                ["Canonicalization", "RFC8785-v1"],
                ["Network", "NEAR testnet"],
                ["Certificate ID", "DEMO-CERT-001"],
                ["Anchor status", "PENDING"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-line bg-white/[0.02] p-3">
                  <dt className="small-caps text-muted-2">{label}</dt>
                  <dd className="mt-1 font-mono text-[10px] text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="hash-box">
              <span className="hash-label">Certificate SHA-256 (fixture)</span>
              <span className="hash-value">{DEMO_CERTIFICATE_HASH}</span>
              <div className="mt-2">
                <CopyButton value={DEMO_CERTIFICATE_HASH} label="Copy hash" />
              </div>
            </div>

            <div className="notice notice--warn">
              <CircleAlert size={15} aria-hidden="true" />
              <span>
                The hash above is a deterministic fixture, not an anchored certificate. The public
                verifier will report <span className="mono">NOT_FOUND</span> until the registry
                integration is implemented.
              </span>
            </div>
          </div>
        </Panel>

        <div className="rail-stack">
          <Panel title="Coverage summary" subtitle="Missing coverage is never treated as a pass.">
            <div className="rail-row">
              <span>Committed conditions</span>
              <strong>6</strong>
            </div>
            <div className="rail-row">
              <span>Attacker runs sealed</span>
              <strong>5 / 8</strong>
            </div>
            <div className="rail-row">
              <span>Accepted findings</span>
              <strong>{accepted.length}</strong>
            </div>
            <div className="rail-row">
              <span>Minority findings preserved</span>
              <strong>2</strong>
            </div>
            <div className="rail-row">
              <span>Divergence index</span>
              <strong className="text-warn">0.2917</strong>
            </div>
          </Panel>

          <Panel title="Gate trace" subtitle="Deterministic and versioned.">
            <ul className="gate-list">
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Eight attacker runs sealed
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Model family and vendor diversity
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Material condition evaluable
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Divergence below threshold
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Red-team reviews recorded
              </li>
            </ul>
          </Panel>

          <Panel title="On-chain registration" subtitle="Testnet only.">
            <div className="flex items-start gap-3">
              <GitCommitHorizontal size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-[12px] leading-relaxed text-muted">
                The registry contract, method, transaction hash and block height will be recorded
                here after Phase 3. No mainnet transaction is authorized.
              </p>
            </div>
            <div className="mt-4 notice notice--info">
              <ShieldCheck size={15} aria-hidden="true" />
              <span>
                Certificate JSON is redacted before publication. No thesis preimage, portfolio data
                or evidence payload is placed on-chain.
              </span>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
