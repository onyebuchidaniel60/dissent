import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  Cpu,
  Database,
  Droplets,
  Fingerprint,
  GitCommitHorizontal,
  LockKeyhole,
  MinusCircle,
  Network,
  PieChart,
  Repeat2,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Users,
  Wallet,
  Waypoints,
  XCircle,
  Zap,
} from "lucide-react";

import { BrandMark, Wordmark } from "@/components/brand";
import { HeroPhone } from "@/components/hero-phone";
import { MODEL_ASSIGNMENTS } from "@/lib/model-assignments";
import { SITE } from "@/lib/site";

import "./landing-v2.css";

export const metadata: Metadata = {
  title: "Don't let the agent grade itself",
  description:
    "Dissent is an adversarial audit protocol for AI trading agents. Eight isolated attackers. Re-fetched evidence. One deterministic, NEAR-anchored verdict.",
  robots: {
    index: false,
    follow: false,
  },
};

const PROBLEM_COPY =
  "AI trading agents can generate and execute financial decisions faster than humans can supervise them. The core problem is that an agent should not be the only judge of its own thesis. A second general-purpose model often shares the first agent's blind spots.";

const SOLUTION_COPY =
  "Dissent forces every thesis to survive an adversarial audit by eight independent, isolated AI attackers. Evidence is re-fetched. Minority dissent is preserved. No majority voting.";

const ECONOMY_COPY =
  "Dissent is its own first client. It generates its own theses, audits them, and executes trades via a scoped vault. It even pays for its own AI compute autonomously using the x402 protocol on NEAR.";

const ATTACKER_ICONS: Record<string, typeof Droplets> = {
  A01: Droplets,
  A02: ShieldAlert,
  A03: BrainCircuit,
  A04: PieChart,
  A05: Repeat2,
  A06: Database,
  A07: Timer,
  A08: BarChart3,
};

const ROSTER = MODEL_ASSIGNMENTS.attackers.map((attacker) => ({
  ...attacker,
  Icon: ATTACKER_ICONS[attacker.attacker_id] ?? ShieldCheck,
}));

const HERO_TRACE = [
  ["Commit", "Thesis + conditions"],
  ["Attack", "A01–A08 isolated"],
  ["Verify", "Evidence re-fetched"],
  ["Anchor", "Certificate sealed"],
] as const;

const PROBLEM_POINTS = [
  {
    title: "Shared blind spots",
    copy: "A second general-purpose model can inherit the same assumptions, data and failure modes as the first.",
  },
  {
    title: "Grading the narrative",
    copy: "The thesis sounds coherent, so the model approves it. Coherence is not coverage, and confidence is not evidence.",
  },
  {
    title: "Speed outruns oversight",
    copy: "Execution lands before a human can test the premise, re-check the source or notice the missing condition.",
  },
] as const;

const SOLUTION_CLAIMS = [
  {
    Icon: Database,
    title: "Evidence re-fetched",
    copy: "Every material claim resolves through an allowlisted adapter, with locators, timestamps and payload hashes.",
  },
  {
    Icon: Users,
    title: "Dissent preserved",
    copy: "Minority findings stay in the certificate. Disagreement is never averaged away to make a result look clean.",
  },
  {
    Icon: Scale,
    title: "No majority voting",
    copy: "A deterministic, versioned policy evaluates coverage, verified evidence and unresolved contradiction.",
  },
] as const;

const ECONOMY_LOOP = [
  ["Originate", "Generate a thesis from a live venue quote."],
  ["Audit", "Send it through the same eight-attacker protocol."],
  ["Execute", "A TRADE certificate can release a capped vault spend."],
  ["Pay", "Settle inference compute through x402 on NEAR."],
] as const;

const STEPS = [
  {
    number: "01",
    eyebrow: "Step 01 · Wallet",
    title: "Connect wallet",
    copy: "Submit a thesis and define the failure conditions that would prove it wrong.",
    Icon: Wallet,
    visual: "thesis",
  },
  {
    number: "02",
    eyebrow: "Step 02 · Audit",
    title: "The audit",
    copy: "Eight isolated attackers attempt to break the thesis. Each run has its own method, model family and evidence grant.",
    Icon: Waypoints,
    visual: "attack",
  },
  {
    number: "03",
    eyebrow: "Step 03 · Verdict",
    title: "The verdict",
    copy: "Receive a cryptographically anchored certificate: TRADE, REFUSE or ABSTAIN, with coverage and dissent intact.",
    Icon: Fingerprint,
    visual: "certificate",
  },
] as const;

const PUBLIC_CERTIFICATE_PATH =
  "/verify/a8df6a5a-8b3c-4f33-9953-4b64593256bf";

const X_SHARE_URL = `https://x.com/intent/post?text=${encodeURIComponent(
  "Dissent — adversarial audits for AI trading agents. Eight isolated attackers. One deterministic verdict.",
)}`;

function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="lv2-kicker">
      <span className="lv2-kicker-index">{index}</span>
      <span className="lv2-kicker-line" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function GitHubMark({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.31.678.921.678 1.856 0 1.34-.012 2.42-.012 2.75 0 .268.18.58.688.482A10.02 10.02 0 0022 12.017C22 6.484 17.523 2 12 2z" />
    </svg>
  );
}

function XMark({ size = 15 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LandingNav() {
  return (
    <header className="lv2-nav">
      <div className="page-width lv2-nav-inner">
        <Link href="/" className="brand" aria-label={`${SITE.name} home`}>
          <BrandMark />
          <Wordmark />
        </Link>

        <nav className="lv2-nav-links" aria-label="Landing page sections">
          <a href="#problem">Problem</a>
          <a href="#attackers">Attackers</a>
          <a href="#economy">Economy</a>
          <a href="#how-it-works">How it works</a>
        </nav>

        <div className="lv2-nav-actions">
          <Link href="/docs" className="lv2-nav-docs">
            Docs
          </Link>
          <Link href="/app" className="button button--primary button--small">
            Launch App
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function LandingFooter() {
  return (
    <footer className="lv2-footer">
      <div className="page-width">
        <div className="lv2-footer-top">
          <div className="lv2-footer-brand">
            <Link href="/" className="brand" aria-label={`${SITE.name} home`}>
              <BrandMark />
              <Wordmark />
            </Link>
            <p>
              Adversarial audit protocol for AI trading agents. Eight isolated attackers,
              re-fetched evidence and a NEAR-anchored certificate before the agent acts.
            </p>
            <span className="lv2-footer-note">
              <i aria-hidden="true" />
              Audit and verification layer, not an exchange or investment adviser.
            </span>
          </div>

          <div className="lv2-footer-cols">
            <nav className="lv2-footer-col" aria-label="Product">
              <p>Product</p>
              <Link href="/app">Launch app</Link>
              <Link href="/docs">Documentation</Link>
              <Link href={PUBLIC_CERTIFICATE_PATH}>Public verifier</Link>
            </nav>

            <nav className="lv2-footer-col" aria-label="Community">
              <p>Community</p>
              <a href={SITE.repoUrl} target="_blank" rel="noreferrer">
                <GitHubMark />
                GitHub
                <ArrowUpRight size={12} aria-hidden="true" />
              </a>
              <a
                href={X_SHARE_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Share Dissent on X (Twitter)"
              >
                <XMark />
                X (Twitter)
                <ArrowUpRight size={12} aria-hidden="true" />
              </a>
              <Link href="/docs#certificates">Certificate spec</Link>
            </nav>
          </div>
        </div>

        <div className="lv2-footer-bottom">
          <span>© 2026 Dissent</span>
          <span>Built on NEAR</span>
          <span>Policy v1.0 · No majority voting</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingV2Page() {
  return (
    <div className="lv2-page">
      <LandingNav />

      <section className="hero lv2-hero" id="top">
        <div className="lv2-hero-grid-overlay" aria-hidden="true" />
        <div className="page-width">
          <div className="hero-grid lv2-hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="eyebrow-dot" />
                Adversarial audit protocol · NEAR
              </span>
              <h1 className="hero-title">
                <span className="block">Don&apos;t let</span>
                <span className="block outline">the agent</span>
                <span className="block accent">grade itself.</span>
              </h1>
              <p className="hero-subtitle">
                An AI trading agent can pick its own evidence, rationalize its own risk and
                execute before anyone checks the premise. Dissent locks the failure conditions
                first, then sends eight isolated attackers to break the thesis.
              </p>
              <div className="hero-actions">
                <Link href="/app" className="button button--primary">
                  Launch App
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link href="/docs" className="button button--ghost">
                  Read the Docs
                </Link>
              </div>
              <div className="hero-meta">
                <span>
                  <strong>8</strong> isolated attackers
                </span>
                <span>
                  <strong>7</strong> model families
                </span>
                <span>
                  <strong>2</strong> inference vendors
                </span>
                <span>
                  <strong>1</strong> deterministic verdict
                </span>
              </div>
            </div>

            <div className="lv2-phone-stage">
              <div className="lv2-phone-rings" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <HeroPhone />
              <div className="lv2-phone-tag">
                <span className="lv2-phone-tag-dot" aria-hidden="true" />
                A01–A08 / SIBLING-BLIND
              </div>
            </div>
          </div>

          <div className="lv2-hero-trace">
            <div className="lv2-hero-trace-steps">
              {HERO_TRACE.map(([label, detail], index) => (
                <div key={label} className="lv2-hero-trace-step">
                  <span className="lv2-hero-trace-index">0{index + 1}</span>
                  <div>
                    <strong>{label}</strong>
                    <small>{detail}</small>
                  </div>
                  {index < HERO_TRACE.length - 1 ? (
                    <ArrowRight className="lv2-hero-trace-arrow" size={14} aria-hidden="true" />
                  ) : null}
                </div>
              ))}
            </div>
            <span className="lv2-hero-trace-seal">
              <Fingerprint size={14} aria-hidden="true" />
              Certificate anchored
            </span>
          </div>
        </div>
      </section>

      <section className="lv2-section lv2-problem" id="problem">
        <div className="page-width">
          <SectionLabel index="01">The problem</SectionLabel>

          <div className="lv2-problem-grid">
            <div className="lv2-problem-copy">
              <h2 className="lv2-display">
                A model cannot
                <br />
                audit <span>itself.</span>
              </h2>
              <p className="lv2-lede">{PROBLEM_COPY}</p>

              <div className="lv2-problem-points">
                {PROBLEM_POINTS.map((point, index) => (
                  <div key={point.title} className="lv2-problem-point">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{point.title}</h3>
                      <p>{point.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <figure className="lv2-self-grade">
              <div className="lv2-self-grade-head">
                <span>UNSUPERVISED LOOP</span>
                <span className="lv2-risk-tag">BLIND SPOT</span>
              </div>

              <div className="lv2-loop">
                <div className="lv2-loop-node">THESIS</div>
                <span className="lv2-loop-arrow" aria-hidden="true">
                  →
                </span>
                <div className="lv2-loop-node">EXECUTE</div>
                <span className="lv2-loop-arrow" aria-hidden="true">
                  →
                </span>
                <div className="lv2-loop-node lv2-loop-node--red">SELF-APPROVE</div>
                <div className="lv2-loop-return">
                  <Repeat2 size={13} aria-hidden="true" />
                  Same model. Same assumptions. No independent check.
                </div>
              </div>

              <div className="lv2-loop-stats">
                <div>
                  <span>INDEPENDENT CHECKS</span>
                  <strong>0</strong>
                </div>
                <div>
                  <span>CONFIDENCE</span>
                  <strong className="lv2-text-red">HIGH</strong>
                </div>
                <div>
                  <span>VERIFIED EVIDENCE</span>
                  <strong>NONE</strong>
                </div>
              </div>

              <figcaption>
                A confident answer is not a falsification test. The model that generated the
                thesis should not be the only model grading it.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="lv2-section lv2-attackers" id="attackers">
        <div className="page-width">
          <div className="lv2-split-head">
            <div>
              <SectionLabel index="02">The solution</SectionLabel>
              <h2 className="lv2-display">
                Eight attackers.
                <br />
                <span>One thesis under fire.</span>
              </h2>
            </div>
            <p className="lv2-lede">{SOLUTION_COPY}</p>
          </div>

          <div className="lv2-attacker-grid">
            {ROSTER.map((attacker) => {
              const Icon = attacker.Icon;
              return (
                <article
                  key={attacker.attacker_id}
                  className="lv2-attacker"
                  title={`${attacker.model_id} · ${attacker.provider}`}
                >
                  <div className="lv2-attacker-head">
                    <span className="lv2-attacker-id">{attacker.attacker_id}</span>
                    <span className="lv2-attacker-icon">
                      <Icon size={17} aria-hidden="true" />
                    </span>
                  </div>
                  <h3>{attacker.name}</h3>
                  <p className="lv2-attacker-method">{attacker.method.replaceAll("_", " ")}</p>
                  <div className="lv2-attacker-foot">
                    <span className="lv2-family">{attacker.model_family}</span>
                    <span>{attacker.provider}</span>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="lv2-roster-meta">
            <div className="lv2-roster-stats">
              <span>
                <strong>7</strong> model families
              </span>
              <span>
                <strong>2</strong> vendors
              </span>
              <span>
                <strong>8/8</strong> sibling-blind
              </span>
            </div>
            <p className="mono">Qwen · GLM · Gemini · GPT-OSS · Flint · Dots · Particle</p>
          </div>

          <div className="lv2-claims">
            {SOLUTION_CLAIMS.map(({ Icon, title, copy }, index) => (
              <article key={title} className="lv2-claim">
                <div className="lv2-claim-top">
                  <span className="lv2-claim-icon">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="lv2-claim-index">0{index + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lv2-section lv2-economy" id="economy">
        <div className="page-width">
          <div className="lv2-economy-grid">
            <div className="lv2-economy-copy">
              <SectionLabel index="03">The autonomous economy</SectionLabel>
              <h2 className="lv2-display">
                It pays for
                <br />
                <span>its own intelligence.</span>
              </h2>
              <p className="lv2-lede">{ECONOMY_COPY}</p>

              <ol className="lv2-cycle">
                {ECONOMY_LOOP.map(([label, copy], index) => (
                  <li key={label}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{label}</strong>
                      <p>{copy}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <figure className="lv2-x402" aria-labelledby="lv2-x402-caption">
              <div className="lv2-x402-head">
                <div>
                  <span className="lv2-x402-eyebrow">COMPUTE PROCUREMENT</span>
                  <strong>x402 / exact</strong>
                </div>
                <span className="tag tag--ok">
                  <CircleDollarSign size={12} aria-hidden="true" />
                  Self-funded
                </span>
              </div>

              <div className="lv2-x402-flow" role="img" aria-label="Agent wallet pays an x402 facilitator, which settles USDC on NEAR and forwards inference requests to OpenRouter and Groq.">
                <div className="lv2-x402-node">
                  <span className="lv2-x402-node-index">01</span>
                  <Wallet size={20} aria-hidden="true" />
                  <strong>Agent wallet</strong>
                  <small>USDC balance</small>
                  <span className="lv2-x402-node-tag">PAYER</span>
                </div>

                <div className="lv2-x402-link" aria-hidden="true">
                  <span>402 challenge</span>
                  <i />
                </div>

                <div className="lv2-x402-node lv2-x402-node--accent">
                  <span className="lv2-x402-node-index">02</span>
                  <Network size={20} aria-hidden="true" />
                  <strong>Facilitator</strong>
                  <small>verify · settle</small>
                  <span className="lv2-x402-node-tag">NEAR</span>
                </div>

                <div className="lv2-x402-link" aria-hidden="true">
                  <span>inference</span>
                  <i />
                </div>

                <div className="lv2-x402-providers">
                  <div className="lv2-x402-node lv2-x402-node--provider">
                    <Cpu size={17} aria-hidden="true" />
                    <strong>OpenRouter</strong>
                    <small>primary</small>
                  </div>
                  <div className="lv2-x402-node lv2-x402-node--provider">
                    <Zap size={17} aria-hidden="true" />
                    <strong>Groq</strong>
                    <small>secondary</small>
                  </div>
                </div>
              </div>

              <div className="lv2-x402-receipt">
                <div>
                  <span>SCHEME</span>
                  <strong>exact</strong>
                </div>
                <div>
                  <span>NETWORK</span>
                  <strong>NEAR</strong>
                </div>
                <div>
                  <span>SETTLEMENT</span>
                  <strong>USDC</strong>
                </div>
                <div>
                  <span>PROVIDER KEYS</span>
                  <strong className="lv2-text-ok">NOT EXPOSED</strong>
                </div>
              </div>

              <figcaption id="lv2-x402-caption">
                A NEP-366 signed delegate authorizes one scoped payment. The facilitator settles
                it on-chain, then returns the inference. No model ever holds a wallet key or a
                provider credential.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="lv2-section lv2-how" id="how-it-works">
        <div className="page-width">
          <div className="lv2-split-head">
            <div>
              <SectionLabel index="04">How it works</SectionLabel>
              <h2 className="lv2-display">
                Three steps.
                <br />
                <span>No blank cheque.</span>
              </h2>
            </div>
            <p className="lv2-lede">
              The thesis and its failure conditions are committed before the attack begins.
              Every verdict is a record, not a vibe.
            </p>
          </div>

          <div className="lv2-steps">
            {STEPS.map(({ number, eyebrow, title, copy, Icon, visual }) => (
              <article key={number} className="lv2-step">
                <span className="lv2-step-watermark" aria-hidden="true">
                  {number}
                </span>
                <div className="lv2-step-head">
                  <span className="lv2-step-icon">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span className="lv2-step-eyebrow">{eyebrow}</span>
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>

                {visual === "thesis" ? (
                  <div className="lv2-mini lv2-mini--thesis">
                    <div className="lv2-mini-row">
                      <span>THESIS</span>
                      <strong>Committed on NEAR</strong>
                    </div>
                    <div className="lv2-mini-row">
                      <span>FAILURE CONDITIONS</span>
                      <strong>Canonicalized</strong>
                    </div>
                    <div className="lv2-mini-lock">
                      <LockKeyhole size={12} aria-hidden="true" />
                      Goalposts locked before dispatch
                    </div>
                  </div>
                ) : null}

                {visual === "attack" ? (
                  <div className="lv2-mini lv2-mini--attack">
                    <div className="lv2-mini-attackers" aria-hidden="true">
                      {ROSTER.map((attacker) => (
                        <span key={attacker.attacker_id}>{attacker.attacker_id}</span>
                      ))}
                    </div>
                    <div className="lv2-mini-attack-foot">
                      <span className="lv2-mini-live">
                        <i aria-hidden="true" />
                        8 isolated runs
                      </span>
                      <span>A05 dissent preserved</span>
                    </div>
                  </div>
                ) : null}

                {visual === "certificate" ? (
                  <div className="lv2-mini lv2-mini--certificate">
                    <div className="lv2-mini-cert-head">
                      <Fingerprint size={13} aria-hidden="true" />
                      CERTIFICATE
                      <span>NEAR</span>
                    </div>
                    <div className="lv2-mini-verdicts">
                      <span data-verdict="TRADE">
                        <CheckCircle2 size={12} aria-hidden="true" />
                        TRADE
                      </span>
                      <span data-verdict="REFUSE">
                        <XCircle size={12} aria-hidden="true" />
                        REFUSE
                      </span>
                      <span data-verdict="ABSTAIN">
                        <MinusCircle size={12} aria-hidden="true" />
                        ABSTAIN
                      </span>
                    </div>
                    <div className="lv2-mini-cert-foot">
                      <span>Policy v1.0</span>
                      <span>Coverage preserved</span>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lv2-section lv2-final-section">
        <div className="page-width">
          <div className="lv2-final">
            <div className="lv2-final-grid" aria-hidden="true" />
            <div className="lv2-final-copy">
              <span className="eyebrow">
                <span className="eyebrow-dot" />
                Bring a thesis
              </span>
              <h2 className="lv2-display">
                Leave with
                <br />
                <span>a record.</span>
              </h2>
              <p>
                Eight attackers. Re-fetched evidence. A deterministic verdict anchored on NEAR.
                The agent can act only after the argument survives.
              </p>
            </div>
            <div className="lv2-final-actions">
              <Link href="/app" className="button button--primary">
                Launch App
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link href="/docs" className="button button--ghost">
                <BookOpen size={15} aria-hidden="true" />
                Read the Docs
              </Link>
              <a
                href={SITE.repoUrl}
                className="button button--quiet"
                target="_blank"
                rel="noreferrer"
              >
                <GitHubMark size={15} />
                GitHub
                <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            </div>
            <div className="lv2-final-foot">
              <span>
                <GitCommitHorizontal size={13} aria-hidden="true" />
                Commit before analysis
              </span>
              <span>
                <Scale size={13} aria-hidden="true" />
                TRADE · REFUSE · ABSTAIN
              </span>
              <span>
                <Fingerprint size={13} aria-hidden="true" />
                Publicly verifiable
              </span>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
