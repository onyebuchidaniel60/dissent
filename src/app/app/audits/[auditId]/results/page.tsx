import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileSearch,
  Fingerprint,
  Scale,
  ShieldCheck,
} from "lucide-react";

import { FixtureBadge, TeeWaiverNotice } from "@/components/fixture-badge";
import { StatusPill } from "@/components/status-pill";
import { PageHeader, Panel } from "@/components/ui";
import {
  DEMO_AUDITS,
  DEMO_ATTACKER_RUNS,
  DEMO_CONDITIONS,
  DEMO_FINDINGS,
  type AssessmentStatus,
} from "@/lib/demo-data";

const GATES = [
  { label: "Eight attacker runs valid and sealed", pass: false },
  { label: "3+ model families and 2 vendors", pass: true },
  { label: "Every material condition evaluable", pass: false },
  { label: "Evidence review complete", pass: true },
  { label: "Sycophancy review complete", pass: true },
  { label: "No unresolved critical contradiction", pass: false },
  { label: "Certificate inputs complete", pass: true },
];

export const dynamic = "force-dynamic";

export default async function AuditResultsPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  const audit = DEMO_AUDITS.find((item) => item.id === auditId);
  if (!audit) notFound();

  const verdict = audit.verdict;
  const accepted = DEMO_FINDINGS.filter((finding) => finding.review === "ACCEPTED");
  const review = DEMO_FINDINGS.filter((finding) => finding.review === "NEEDS_REVIEW");

  return (
    <>
      <PageHeader
        eyebrow={`Result surface · ${audit.publicId}`}
        title="Coverage, dissent"
        accent="and the gate trace."
        description="The result is assembled from validated attacker outputs, evidence reviews, reproducibility checks and a deterministic policy. No model issues the protocol verdict."
        actions={
          <>
            <Link href={`/app/audits/${audit.id}`} className="button button--ghost">
              <ArrowLeft size={14} aria-hidden="true" />
              Audit detail
            </Link>
            <Link href="/app/certificates/DEMO-CERT-001" className="button button--primary">
              Certificate
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FixtureBadge />
        <StatusPill status={audit.status} />
        {verdict ? <StatusPill status={verdict} /> : <span className="tag tag--warn">Verdict pending</span>}
        <span className="tag tag--muted">Policy v1.0</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="verdict-block">
          <span className="verdict-label">Protocol verdict</span>
          <span className="verdict-value" data-verdict={verdict ?? "PENDING"}>
            {verdict ?? "PENDING"}
          </span>
          <p className="text-[12px] leading-relaxed text-muted">
            {verdict === "ABSTAIN"
              ? "A material condition is an accepted invalid test, and the attacker set is not fully sealed. The policy cannot return TRADE with incomplete coverage."
              : "The audit is still under attack. No protocol verdict is issued before all required reviews close."}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="tag tag--muted">No majority vote</span>
            <span className="tag tag--muted">No confidence weighting</span>
          </div>
        </div>

        <Panel title="Gate trace" subtitle="Every gate records its input references and rule version.">
          <ul className="gate-list">
            {GATES.map((gate) => (
              <li key={gate.label} className="gate" data-pass={gate.pass}>
                {gate.pass ? <CheckCircle2 aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
                {gate.label}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <span className="tag tag--ok">policy pinned</span>
            <span className="tag tag--warn">coverage incomplete</span>
            <span className="tag tag--warn">divergence unresolved</span>
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="Condition coverage"
          subtitle="Each committed condition × each attacker. UNVERIFIABLE is a data-quality state, not a fifth Section A verdict."
          action={<span className="tag tag--muted">8 × 6 matrix</span>}
          bodyClassName=""
        >
          <div className="coverage-wrap">
            <table className="coverage-table">
              <caption className="sr-only">
                Condition coverage matrix for {audit.publicId}; demo fixture
              </caption>
              <thead>
                <tr>
                  <th scope="col">Condition</th>
                  {DEMO_ATTACKER_RUNS.map((run) => (
                    <th key={run.attacker_id} scope="col">
                      {run.attacker_id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_CONDITIONS.map((condition) => (
                  <tr key={condition.id}>
                    <td>
                      <strong>{condition.id}</strong>
                      <span>{condition.description}</span>
                    </td>
                    {condition.assessments.map((status, index) => (
                      <td key={`${condition.id}-${index}`}>
                        <AssessmentCell status={status} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
            {(["HIT", "PARTIAL", "NOT_HIT", "INVALID_TEST", "UNVERIFIABLE"] as AssessmentStatus[]).map(
              (status) => (
                <AssessmentCell key={status} status={status} />
              ),
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title={`Findings · ${accepted.length} accepted`}
          subtitle="Accepted findings are evidence-supported, material and non-duplicate. Minority findings remain visible."
        >
          {DEMO_FINDINGS.map((finding) => (
            <article key={finding.id} className="finding">
              <div className="finding-head">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="mono text-[9px] text-primary">{finding.id}</span>
                    <span className="tag tag--muted">Section {finding.section}</span>
                  </div>
                  <h3 className="finding-title">{finding.title}</h3>
                </div>
                <StatusPill status={finding.review} />
              </div>
              <p className="finding-body">{finding.summary}</p>
              <p className="finding-note">{finding.outside}</p>
              <div className="finding-meta">
                <span className="tag tag--muted">{finding.severity}</span>
                <StatusPill status={finding.evidence} />
                <StatusPill status={finding.reproducibility} />
                <span className="tag tag--muted">{finding.novelty}</span>
              </div>
            </article>
          ))}
        </Panel>

        <div className="rail-stack">
          <Panel title="Dissent preserved" subtitle="The certificate does not flatten disagreement.">
            <div className="flex items-start gap-3">
              <Scale size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-[12px] leading-relaxed text-muted">
                {review.length} finding is in <span className="text-warn">NEEDS_REVIEW</span>.
                The adjudicator records the unresolved material contradiction instead of taking a
                modal status.
              </p>
            </div>
            <div className="mt-4 hash-box">
              <span className="hash-label">Divergence index</span>
              <span className="mono text-lg text-warn">0.2917</span>
              <span className="text-[10px] leading-relaxed text-muted-2">
                Above the 0.25 threshold. A verified HIT/NOT_HIT conflict on a critical condition
                forces ABSTAIN unless evidence re-fetch resolves it.
              </span>
            </div>
          </Panel>

          <Panel title="Evidence posture" subtitle="Source re-fetch precedes acceptance.">
            <div className="rail-row">
              <span className="flex items-center gap-2">
                <FileSearch size={13} aria-hidden="true" />
                Verified claims
              </span>
              <strong>4</strong>
            </div>
            <div className="rail-row">
              <span>Partially verified</span>
              <strong>1</strong>
            </div>
            <div className="rail-row">
              <span>Unverifiable</span>
              <strong>1</strong>
            </div>
            <div className="rail-row">
              <span>Contradicted</span>
              <strong>0</strong>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-muted-2">
              A source outage is not proof the claim is false. Snapshot time and block identity are
              compared before any contradiction is recorded.
            </p>
          </Panel>

          <div className="panel panel--glow">
            <div className="panel-body">
              <div className="flex items-center gap-2">
                <Fingerprint size={16} className="text-primary" aria-hidden="true" />
                <h2 className="panel-title">Certificate</h2>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                The preview certificate is a fixture. Hash anchoring and on-chain verification are
                wired in Phase 3–5; the public verifier will show{" "}
                <span className="mono">NOT_FOUND</span> until then.
              </p>
              <Link
                href="/app/certificates/DEMO-CERT-001"
                className="button button--primary button--small mt-4"
              >
                Open certificate
                <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <TeeWaiverNotice compact />
        </div>
      </div>

      <div className="mt-4 notice notice--info">
        <ShieldCheck size={15} aria-hidden="true" />
        <span>
          This result surface is a deterministic fixture. It is explicitly not a live model run, a
          live market result or an anchored certificate.
        </span>
      </div>
    </>
  );
}

function AssessmentCell({ status }: { status: AssessmentStatus | string }) {
  const normalized = status === "UNVERIFIABLE" ? "UNVERIFIABLE" : status;
  return (
    <span className="assessment" data-status={normalized}>
      {normalized.replaceAll("_", " ")}
    </span>
  );
}
