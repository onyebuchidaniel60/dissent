import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Database,
  FileSearch,
  Fingerprint,
  GitCommitHorizontal,
  LockKeyhole,
  Scale,
  ShieldCheck,
  ShieldOff,
  Users,
} from "lucide-react";

import { FixtureBadge, TeeWaiverNotice } from "@/components/fixture-badge";
import { SectionHeading } from "@/components/ui";
import { DEMO_ATTACKER_RUNS, DEMO_FINDINGS } from "@/lib/demo-data";
import { SITE } from "@/lib/site";

const PILLARS = [
  {
    icon: GitCommitHorizontal,
    title: "Commit before analysis",
    copy: "The thesis and its failure conditions are canonicalized and committed on NEAR testnet before an attacker sees them. The goalposts cannot move afterward.",
    meta: "RFC 8785 · SHA-256 · NEAR registry",
  },
  {
    icon: Users,
    title: "Eight isolated specialists",
    copy: "Liquidity, asset safety, logic, portfolio correlation, inversion, provenance, timing and base rate. Each run has its own method, model and data grant.",
    meta: "Sibling-blind · section A/B · no shared context",
  },
  {
    icon: FileSearch,
    title: "Evidence gets re-fetched",
    copy: "The Evidence Auditor resolves every claim through an allowlisted adapter. The Sycophancy Auditor checks whether Section B introduced a real new risk.",
    meta: "Typed adapters · payload hashes · freshness",
  },
  {
    icon: Scale,
    title: "No majority vote",
    copy: "A deterministic, versioned policy evaluates coverage, verified evidence, diversity and unresolved conflict. Disagreement is preserved, not averaged away.",
    meta: "TRADE · REFUSE · ABSTAIN",
  },
];

const GATES = [
  { label: "Eight terminal attacker runs", pass: false },
  { label: "Model-family and vendor diversity", pass: true },
  { label: "Every material condition evaluable", pass: false },
  { label: "Evidence and red-team reviews complete", pass: true },
  { label: "No unresolved critical contradiction", pass: false },
  { label: "Certificate inputs complete", pass: true },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="page-width">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              Adversarial audit protocol · NEAR testnet
            </span>
            <h1 className="hero-title">
              <span className="block">Don&apos;t let</span>
              <span className="block outline">the agent</span>
              <span className="block accent">grade itself.</span>
            </h1>
            <p className="hero-subtitle">
              An autonomous trading agent can choose its own evidence, rationalize its own risk and
              execute before anyone checks the premise. Dissent commits the failure conditions
              first, then sends eight isolated attackers to break the thesis.
            </p>
            <div className="hero-actions">
              <Link href="/app" className="button button--primary">
                Open the audit console
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link href="/docs" className="button button--ghost">
                Read the protocol
              </Link>
              <a
                href={SITE.repoUrl}
                className="button button--quiet"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
            <div className="hero-meta">
              <span>
                <strong>8</strong> isolated attackers
              </span>
              <span>
                <strong>8</strong> distinct model families
              </span>
              <span>
                <strong>2</strong> inference vendors
              </span>
              <span>
                <strong>1</strong> deterministic verdict
              </span>
              <span className="text-primary-bright">TEE waived · budget constraint</span>
            </div>
          </div>

          <div className="landing-preview" aria-label="Dissent audit console preview">
            <div className="preview-topbar">
              <div className="flex items-center gap-3">
                <div className="preview-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="small-caps text-muted">Audit console / preview</span>
              </div>
              <FixtureBadge />
            </div>

            <div className="preview-body">
              <div className="preview-main">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="small-caps text-muted-2">Audit desk</p>
                    <p className="preview-greeting">One thesis. Eight challenges.</p>
                  </div>
                  <span className="status status--info">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                    Attacking
                  </span>
                </div>

                <div className="preview-grid">
                  <div className="preview-card">
                    <div className="flex items-center justify-between gap-2">
                      <span className="small-caps text-muted-2">Condition coverage</span>
                      <span className="mono text-[10px] text-primary">5 / 8</span>
                    </div>
                    <strong className="mt-2">Sealed attacker outputs</strong>
                    <div className="mini-bars" aria-hidden="true">
                      {[42, 66, 34, 88, 52, 74, 29, 61].map((height, index) => (
                        <span key={index} style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>

                  <div className="preview-card">
                    <div className="flex items-center justify-between gap-2">
                      <span className="small-caps text-muted-2">Coverage signal</span>
                      <CircleAlert size={14} className="text-warn" aria-hidden="true" />
                    </div>
                    <strong className="mt-2">One invalid test</strong>
                    <span>FC-005 has no measurable threshold. Preserved as a condition critique.</span>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="assessment" data-status="HIT">
                        HIT
                      </span>
                      <span className="assessment" data-status="NOT_HIT">
                        NOT_HIT
                      </span>
                      <span className="assessment" data-status="INVALID_TEST">
                        INVALID
                      </span>
                      <span className="assessment" data-status="UNVERIFIABLE">
                        UNVERIFIABLE
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {DEMO_ATTACKER_RUNS.slice(0, 4).map((attacker) => (
                    <div key={attacker.attacker_id} className="attacker-card">
                      <div className="attacker-id">
                        {attacker.attacker_id}
                        <span className="text-muted-2">{attacker.runStatus}</span>
                      </div>
                      <p className="attacker-name">{attacker.name}</p>
                      <p className="attacker-model">{attacker.model_id}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="preview-rail" aria-label="Preview audit rail">
                <p className="small-caps text-muted-2">Commitment</p>
                <div className="rail-row">
                  <span>Conditions</span>
                  <strong>6 committed</strong>
                </div>
                <div className="rail-row">
                  <span>Network</span>
                  <strong>testnet</strong>
                </div>
                <div className="rail-row">
                  <span>Fee</span>
                  <strong>0.1 NEAR</strong>
                </div>
                <div className="rail-row">
                  <span>Policy</span>
                  <strong>v1.0</strong>
                </div>
                <div className="rail-row">
                  <span>TEE</span>
                  <strong className="text-warn">waived</strong>
                </div>

                <div className="mt-5 border-t border-line pt-4">
                  <p className="small-caps text-muted-2">Verdict</p>
                  <p className="mt-2 font-display text-2xl font-bold tracking-tight text-warn">
                    PENDING
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted">
                    No verdict is issued until every required gate is complete. Missing data is not
                    a negative result.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-width">
          <SectionHeading
            eyebrow="The protocol"
            title="An argument with"
            accent="receipts."
            description="Dissent does not ask a second general-purpose model whether it agrees. It creates independent attack paths, then makes every material claim answer to evidence."
          />

          <div className="two-col">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article key={pillar.title} className="panel panel--raised">
                  <div className="panel-body">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line-red bg-primary/10 text-primary">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-bold uppercase tracking-tight">
                      {pillar.title}
                    </h3>
                    <p className="mt-3 text-[13px] leading-relaxed text-muted">{pillar.copy}</p>
                    <p className="mt-5 border-t border-line pt-3 font-mono text-[9px] uppercase tracking-[0.13em] text-muted-2">
                      {pillar.meta}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="page-width">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <SectionHeading
              eyebrow="The attackers"
              title="Eight specialists."
              accent="One contract."
              description="Every attacker returns the same machine-readable envelope: every committed condition exactly once, plus a justified search beyond the conditions."
            />

            <div className="attacker-grid">
              {DEMO_ATTACKER_RUNS.map((attacker) => (
                <article key={attacker.attacker_id} className="attacker-card">
                  <div className="attacker-id">
                    {attacker.attacker_id}
                    <span className="text-muted-2">{attacker.runStatus}</span>
                  </div>
                  <p className="attacker-name">{attacker.name}</p>
                  <p className="attacker-model">{attacker.model_id}</p>
                  <div className="attacker-footer">
                    <span>{attacker.model_family}</span>
                    <span>{attacker.provider}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <TeeWaiverNotice />
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="page-width">
          <div className="panel panel--glow overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="p-6 sm:p-8">
                <span className="eyebrow">
                  <span className="eyebrow-dot" />
                  Evidence review
                </span>
                <h2 className="section-title mt-4">
                  Verdicts are not
                  <br />
                  <span className="accent">a vote count.</span>
                </h2>
                <p className="section-lede mt-4">
                  A verified critical failure forces <span className="text-danger">REFUSE</span>.
                  Incomplete coverage, a material invalid test or unresolved contradiction forces{" "}
                  <span className="text-warn">ABSTAIN</span>. <span className="text-ok">TRADE</span>{" "}
                  requires every positive gate to pass. A confident model cannot move a gate.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="verdict-block">
                    <span className="verdict-label">Example verdict</span>
                    <span className="verdict-value" data-verdict="ABSTAIN">
                      ABSTAIN
                    </span>
                    <span className="text-[11px] leading-relaxed text-muted">
                      Material condition FC-005 is an accepted invalid test. Missing coverage is
                      never treated as <span className="mono">NOT_HIT</span>.
                    </span>
                  </div>

                  <div className="panel panel--raised">
                    <div className="panel-body">
                      <p className="small-caps text-muted-2">Gate trace</p>
                      <ul className="gate-list mt-3">
                        {GATES.map((gate) => (
                          <li key={gate.label} className="gate" data-pass={gate.pass}>
                            {gate.pass ? (
                              <CheckCircle2 aria-hidden="true" />
                            ) : (
                              <CircleAlert aria-hidden="true" />
                            )}
                            {gate.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-line bg-black/20 p-6 sm:p-8 lg:border-l lg:border-t-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="small-caps text-muted-2">Finding cluster</p>
                    <h3 className="mt-2 font-display text-xl font-bold uppercase tracking-tight">
                      {DEMO_FINDINGS[0].title}
                    </h3>
                  </div>
                  <span className="tag tag--ok">Accepted</span>
                </div>
                <p className="mt-4 text-[13px] leading-relaxed text-muted">
                  {DEMO_FINDINGS[0].summary}
                </p>
                <dl className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    ["Section", "B · outside conditions"],
                    ["Severity", DEMO_FINDINGS[0].severity],
                    ["Evidence", DEMO_FINDINGS[0].evidence],
                    ["Reproduction", DEMO_FINDINGS[0].reproducibility],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-line bg-white/[0.02] p-3">
                      <dt className="small-caps text-muted-2">{label}</dt>
                      <dd className="mt-1 font-mono text-[10px] text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href="/app/audits/demo-audit-001/results" className="button button--primary button--small">
                    See the result surface
                  </Link>
                  <Link href="/verify/DEMO-CERT-001" className="button button--ghost button--small">
                    <Fingerprint size={13} aria-hidden="true" />
                    Verify a certificate
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="page-width">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Database,
                title: "Typed evidence, not screenshots",
                copy: "Allowlisted adapters return locators, timestamps, block hashes and normalized values. The server calculates the payload hash.",
              },
              {
                icon: LockKeyhole,
                title: "No model has a wallet",
                copy: "Attackers get read-only tools, no sibling outputs and no signing capability. The registry and escrow are separate from inference.",
              },
              {
                icon: ShieldCheck,
                title: "Failure stays visible",
                copy: "Missing coverage becomes ABSTAIN. A failed run is never rewritten as NOT_HIT. Minority findings stay in the certificate.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="panel panel--raised">
                  <div className="panel-body">
                    <Icon size={18} className="text-primary" aria-hidden="true" />
                    <h3 className="mt-4 text-sm font-extrabold">{item.title}</h3>
                    <p className="mt-2 text-[12px] leading-relaxed text-muted">{item.copy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="page-width">
          <div className="panel panel--glow p-6 sm:p-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <span className="eyebrow">
                  <span className="eyebrow-dot" />
                  Next action
                </span>
                <h2 className="section-title mt-4 max-w-3xl">
                  Bring a thesis.
                  <br />
                  Leave with <span className="accent">a record.</span>
                </h2>
                <p className="section-lede mt-4">
                  The preview shows the route-complete console with synthetic fixtures. Wallet
                  sessions, live dispatch and contract verification are wired in later phases and
                  will be labelled when they are.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/app/audits/new" className="button button--primary">
                  Start an audit
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link href="/docs" className="button button--ghost">
                  Read the docs
                </Link>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-5 text-[11px] text-muted-2">
              <ShieldOff size={14} className="text-warn" aria-hidden="true" />
              TEE attestation is waived under the no-new-spend constraint. No confidential-inference
              claim is made.
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
