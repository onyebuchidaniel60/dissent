import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Fingerprint,
  LockKeyhole,
  ShieldOff,
} from "lucide-react";

import { FixtureBadge } from "@/components/fixture-badge";
import { PageHeader, Panel } from "@/components/ui";
import { SITE } from "@/lib/site";

const REPO_DOCS = `${SITE.repoUrl}/blob/main`;

const SECTIONS = [
  ["overview", "Overview"],
  ["quickstart", "Quickstart"],
  ["architecture", "Architecture"],
  ["commitments", "Commitments"],
  ["attackers", "Attackers"],
  ["adjudication", "Adjudication"],
  ["evidence", "Evidence"],
  ["certificates", "Certificates"],
  ["security", "Security"],
  ["wallet-auth", "Wallet auth"],
  ["api-keys", "API keys"],
  ["reputation", "Reputation"],
  ["deployment", "Deployment"],
  ["demo", "Demo"],
  ["limitations", "Current limitations"],
] as const;

function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-ink underline decoration-primary/50 underline-offset-4 hover:decoration-primary"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}

export default function DocsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Documentation · preview"
        title="The protocol,"
        accent="without the pitch."
        description="Implementation notes, trust boundaries and the current limitations of the preview. The detailed normative specifications remain in the repository docs."
        actions={
          <a href={SITE.repoUrl} className="button button--ghost" target="_blank" rel="noreferrer">
            Open repository
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FixtureBadge />
        <span className="tag tag--muted">Phase 1 checkpoint</span>
        <span className="tag tag--warn">TEE waived</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <nav className="panel panel--raised sticky top-24 hidden lg:block" aria-label="On this page">
          <div className="panel-body">
            <p className="small-caps text-muted-2">On this page</p>
            <ul className="mt-3 grid gap-2">
              {SECTIONS.map(([id, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="text-[11px] text-muted transition-colors hover:text-ink"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="stack-lg min-w-0">
          <Panel title="Overview" subtitle="What Dissent is, and what it is not.">
            <div id="overview" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                Dissent is an evidence-backed adversarial audit protocol for AI trading agents. A
                client submits a thesis and a set of machine-testable failure conditions, commits
                their canonical hashes on NEAR testnet, funds a fixed testnet audit fee, and receives
                eight isolated attack analyses followed by evidence review, sycophancy review,
                reproducibility checks and a deterministic verdict.
              </p>
              <p>
                It is not a trading venue, broker, custodian, wallet or investment adviser. The MVP
                does not execute live trades or move mainnet funds. A failed, incomplete or
                unverifiable audit never becomes a positive result.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/app" className="button button--primary button--small">
                  Open console
                  <ArrowRight size={12} aria-hidden="true" />
                </Link>
                <a
                  href={`${REPO_DOCS}/PROJECT_SPEC.md`}
                  className="button button--ghost button--small"
                  target="_blank"
                  rel="noreferrer"
                >
                  Project spec
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </div>
            </div>
          </Panel>

          <Panel title="Quickstart" subtitle="Local development for this checkpoint.">
            <div id="quickstart" className="scroll-mt-24" />
            <pre className="doc-code">
              <code>{`pnpm install
pnpm dev            # http://localhost:3000
pnpm typecheck
pnpm test
pnpm build
pnpm start          # production server

curl -i http://localhost:3000/healthz
curl -i http://localhost:3000/readyz`}</code>
            </pre>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              The preview needs a PostgreSQL URL for <span className="mono">/readyz</span> and the
              in-process queue. <span className="mono">/healthz</span> never touches the database.
              See <DocLink href={`${REPO_DOCS}/docs/SETUP.md`}>docs/SETUP.md</DocLink> and{" "}
              <DocLink href={`${REPO_DOCS}/docs/CONFIGURATION.md`}>docs/CONFIGURATION.md</DocLink>.
            </p>
          </Panel>

          <Panel title="Architecture" subtitle="Modular monolith with an in-process runner.">
            <div id="architecture" className="scroll-mt-24" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Web + API", "Next.js App Router, React and TypeScript route handlers."],
                ["Database", "PostgreSQL 16+ on Neon, Drizzle ORM and explicit migrations."],
                ["Queue", "pg-boss inside the web process; no separate Render worker."],
                ["Contracts", "Rust + near-sdk on NEAR testnet only."],
                ["Models", "One OpenAI-compatible adapter; OpenRouter primary, Groq secondary."],
                ["Tests", "Vitest, Playwright and near-workspaces contract tests."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-xl border border-line bg-white/[0.02] p-3">
                  <p className="text-[12px] font-extrabold text-ink">{title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">{copy}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              Render free web services have no background worker, so the durable queue is started
              in-process with a small connection pool. Concurrency is capped at one audit and three
              parallel attackers for the 512 MB instance. See{" "}
              <DocLink href={`${REPO_DOCS}/ARCHITECTURE.md`}>ARCHITECTURE.md</DocLink>.
            </p>
          </Panel>

          <Panel title="Commitments" subtitle="The goalposts are fixed before analysis.">
            <div id="commitments" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                Thesis and condition preimages are normalized, serialized with versioned RFC 8785
                canonical JSON and hashed with SHA-256. The client signs{" "}
                <span className="mono text-ink">commit_audit</span> on NEAR testnet. The backend
                verifies the contract, method, predecessor, audit ID, hashes and finality before the
                preimage is revealed to attackers.
              </p>
              <p>
                A fixed testnet fee quote is issued only after commitment. The client funds the
                exact quote; attacker dispatch happens only after both the commitment and funding
                are verified. A committed audit is immutable. Changing conditions requires a new
                audit.
              </p>
              <div className="notice notice--warn">
                <LockKeyhole size={15} aria-hidden="true" />
                <span>
                  No model receives a wallet or signing capability. The client signer is separate
                  from the deployer and the backend relayer.
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="Attackers" subtitle="Eight specialists, one schema.">
            <div id="attackers" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                The frozen roster is A01 Liquidity / Execution, A02 Asset Safety, A03 Logic /
                Coherence, A04 Correlation / Portfolio, A05 Thesis Inversion, A06 Data Provenance,
                A07 Timing / MEV and A08 Base Rate. Every attacker must assess every committed
                condition exactly once in Section A and conduct a justified search outside the
                conditions in Section B.
              </p>
              <p>
                Attackers see the thesis and committed conditions, their own method instructions and
                typed read-only evidence tools. They never see sibling outputs, adjudicator state or
                prior verdicts. The common envelope is validated against{" "}
                <DocLink href={`${REPO_DOCS}/schemas/attacker-output-v1.schema.json`}>
                  attacker-output-v1.schema.json
                </DocLink>
                .
              </p>
              <div className="notice notice--info">
                <ShieldOff size={15} aria-hidden="true" />
                <span>
                  TEE attestation is waived under the zero-new-spend constraint. The UI does not show
                  a TEE badge. The model-family, vendor and open-weight gates remain enforced.
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="Adjudication" subtitle="No majority vote, no confidence weighting.">
            <div id="adjudication" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                Verdict precedence is fixed: a verified accepted disqualifier produces{" "}
                <span className="mono text-danger">REFUSE</span>; a failed coverage, diversity,
                evidence, review or unresolved-conflict gate produces{" "}
                <span className="mono text-warn">ABSTAIN</span>;{" "}
                <span className="mono text-ok">TRADE</span> only when every positive gate passes.
              </p>
              <p>
                Severity weights and finding scores rank findings for display and bounty arithmetic.
                They do not decide the verdict by summation. The divergence index measures verified
                disagreement at the same snapshot and forces abstention at or above 0.25 unless the
                Evidence Auditor resolves the conflict.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="tag tag--muted">policy v1.0</span>
                <span className="tag tag--muted">versioned</span>
                <span className="tag tag--muted">deterministic</span>
              </div>
            </div>
          </Panel>

          <Panel title="Evidence" subtitle="A source outage is not proof of absence.">
            <div id="evidence" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                Evidence records are created by trusted adapters, not authored freely by a model.
                Each record stores the source adapter, resource ID, typed locator, observation and
                retrieval times, block identity where relevant, normalized value, server-computed
                payload hash, freshness result and limitations.
              </p>
              <p>
                Re-fetch uses the stored typed locator, never a model-supplied URL. Unavailable
                sources are <span className="mono">UNVERIFIABLE</span>; a changed live value is not
                automatically a contradiction of an older observation. The Evidence Auditor and
                Sycophancy Auditor records are append-only.
              </p>
            </div>
          </Panel>

          <Panel title="Certificates" subtitle="Preserve disagreement, then anchor the hash.">
            <div id="certificates" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                The certificate is canonical JSON containing the verdict, policy version, coverage
                matrix, accepted and minority findings, evidence outcomes and the decision trace. Its
                SHA-256 hash is registered on the NEAR testnet registry. The public verifier
                recomputes the hash and compares it with the chain record; it never exposes the
                thesis preimage, positions or private evidence.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/verify/DEMO-CERT-001" className="button button--ghost button--small">
                  <Fingerprint size={12} aria-hidden="true" />
                  Preview verifier
                </Link>
                <span className="tag tag--warn">anchor pending</span>
              </div>
            </div>
          </Panel>

          <Panel title="Security" subtitle="Fail closed for verdict-critical uncertainty.">
            <div id="security" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                Client API keys are high-entropy opaque tokens stored as hashes. Every object query
                is scoped by the authenticated workspace at the service layer. Cookie-authenticated
                mutations use CSRF protection; API-key clients use an Authorization header. Attackers
                have no shell, arbitrary HTTP, filesystem, SQL, wallet or model-to-model access.
              </p>
              <p>
                External data and model output are untrusted. Evidence retrieval is limited to typed
                adapters with fixed hosts; private IPs, redirects to private networks, non-HTTPS
                schemes and credential forwarding are blocked. Logs redact authorization headers,
                cookies, keys and connection strings. See{" "}
                <DocLink href={`${REPO_DOCS}/docs/SECURITY_SPEC.md`}>docs/SECURITY_SPEC.md</DocLink>.
              </p>
            </div>
          </Panel>

          <Panel title="Wallet authentication" subtitle="No email or password.">
            <div id="wallet-auth" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                Human sessions use the official NEAR wallet-selector SDK. The user connects a
                wallet, requests a server-issued nonce, signs the message, and the server verifies
                the signature against the account access key through NEAR RPC. The server then sets
                an HttpOnly, SameSite=Lax, Secure session cookie with an eight-hour expiry.
              </p>
              <p>
                Nonces are single-use and expire within five minutes. Logout clears the cookie and
                invalidates the server-side session. Operator routes require the verified account to
                be in <span className="mono">ADMIN_WALLET_ADDRESSES</span>; the check is server-side.
                A wallet address in a request body is never trusted.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="tag tag--muted">NEAR Wallet Selector</span>
                <span className="tag tag--muted">signed nonce</span>
                <span className="tag tag--muted">HttpOnly cookie</span>
              </div>
            </div>
          </Panel>

          <Panel title="API keys" subtitle="Scoped for autonomous agents.">
            <div id="api-keys" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                Client agents use <span className="mono">Authorization: Bearer ds_...</span> keys
                with the scopes <span className="mono">audit:create</span>,{" "}
                <span className="mono">audit:read:own</span> and{" "}
                <span className="mono">certificate:read:own</span>. A key is displayed once at
                issuance and stored only as a salted hash. Rotation and revocation are supported.
              </p>
              <p>
                Keys cannot list clients, read another workspace or sign a wallet transaction.
                Authorization is enforced server-side for every object read and write. The demo key
                is provisioned by the operator CLI and never written to a repository file.
              </p>
            </div>
          </Panel>

          <Panel title="Reputation" subtitle="Derived from finalized records only.">
            <div id="reputation" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                Reputation events are append-only and keyed by attacker, audit, event type and
                finding. They are written once from finalized accepted or rejected finding records.
                Replaying the finalization cannot double-count. Fixtures do not enter the ledger.
              </p>
            </div>
          </Panel>

          <Panel title="Deployment" subtitle="Render free web + Neon free Postgres.">
            <div id="deployment" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                The public preview runs as a Render free web service with a Neon PostgreSQL
                database. The service has no separate background worker; pg-boss runs in-process.
                Render free instances spin down after idle, so the first request can take around 50
                seconds. <span className="mono">/healthz</span> is kept warm by an external ping;
                <span className="mono"> /readyz</span> checks the database.
              </p>
              <pre className="doc-code">
                <code>{`Build: pnpm install && pnpm build
Start: pnpm start
Health: /healthz
Readiness: /readyz`}</code>
              </pre>
              <p>
                See <DocLink href={`${REPO_DOCS}/docs/DEPLOYMENT.md`}>docs/DEPLOYMENT.md</DocLink> for
                the exact environment configuration and release boundary.
              </p>
            </div>
          </Panel>

          <Panel title="Demo" subtitle="Deterministic capture, disclosed fixtures.">
            <div id="demo" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                The final demo is captured with Playwright at 1280×720, uses deterministic demo data,
                and is narrated with the operator-supplied ElevenLabs voice. Royalty-free background
                music is credited in the production notes. Any fixture-driven beat is labelled on
                screen and in the narration.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="tag tag--muted">≤ 180 seconds</span>
                <span className="tag tag--muted">H.264 + AAC</span>
                <span className="tag tag--muted">burned-in captions</span>
              </div>
            </div>
          </Panel>

          <Panel title="Current limitations" subtitle="What this checkpoint does not do.">
            <div id="limitations" className="scroll-mt-24" />
            <ul className="gate-list">
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Wallet-selector connect and signed-nonce sessions are not live yet.
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                The audit form validates locally but does not submit to an API or chain.
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Attacker dispatch, provider calls and the evidence pipeline are preview fixtures.
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                The registry and escrow contracts are not deployed in this checkpoint.
              </li>
              <li className="gate" data-pass="false">
                <ShieldOff aria-hidden="true" />
                TEE attestation is waived by the zero-new-spend constraint.
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Route shell, health checks, in-process queue bootstrap and responsive layout exist.
              </li>
            </ul>
            <p className="mt-4 text-[10px] leading-relaxed text-muted-2">
              This page is intentionally explicit about the difference between a fixture and a live
              audit. No synthetic result is presented as production evidence.
            </p>
          </Panel>

          <div className="panel panel--glow">
            <div className="panel-body flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="eyebrow">
                  <span className="eyebrow-dot" />
                  Source documents
                </p>
                <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-muted">
                  The normative specs are in the public repository: product, architecture,
                  adjudication, security, contract, API, data model and the attacker schema.
                </p>
              </div>
              <a href={SITE.repoUrl} className="button button--primary" target="_blank" rel="noreferrer">
                <BookOpen size={14} aria-hidden="true" />
                Open repository
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
