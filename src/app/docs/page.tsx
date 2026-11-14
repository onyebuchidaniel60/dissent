import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Fingerprint,
  LockKeyhole,
} from "lucide-react";

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
  ["execution", "Execution"],
  ["security", "Security"],
  ["wallet-auth", "Wallet auth"],
  ["api-keys", "API keys"],
  ["reputation", "Reputation"],
  ["deployment", "Deployment"],
  ["limitations", "Boundaries"],
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
        eyebrow="Documentation"
        title="The protocol,"
        accent="without the pitch."
        description="Implementation notes, trust boundaries and operational requirements. The detailed normative specifications remain in the repository docs."
        actions={
          <a href={SITE.repoUrl} className="button button--ghost" target="_blank" rel="noreferrer">
            Open repository
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="tag tag--ok">Policy v1.0</span>
        <span className="tag tag--muted">RFC 8785</span>
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
                    className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted transition hover:text-ink"
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
                client submits a thesis and machine-testable failure conditions, commits their
                canonical hashes on NEAR, funds a fixed audit quote, and receives eight isolated
                attack analyses followed by evidence review, sycophancy review, reproducibility
                checks and a deterministic verdict.
              </p>
              <p>
                It is not a trading venue, broker, custodian, wallet or investment adviser. A failed,
                incomplete or unverifiable audit never becomes a positive result.
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

          <Panel title="Quickstart" subtitle="Local development and deployment checks.">
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
              <span className="mono">/readyz</span> needs a PostgreSQL URL for the in-process queue.{" "}
              <span className="mono">/healthz</span> never touches the database. See{" "}
              <DocLink href={`${REPO_DOCS}/docs/SETUP.md`}>docs/SETUP.md</DocLink> and{" "}
              <DocLink href={`${REPO_DOCS}/docs/CONFIGURATION.md`}>docs/CONFIGURATION.md</DocLink>.
            </p>
          </Panel>

          <Panel title="Architecture" subtitle="Modular monolith with an in-process runner.">
            <div id="architecture" className="scroll-mt-24" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Web + API", "Next.js App Router, React and TypeScript route handlers."],
                ["Database", "PostgreSQL 16+ on Neon, Drizzle ORM and explicit migrations."],
                ["Queue", "pg-boss inside the web process; no separate worker service."],
                ["Contracts", "Rust + near-sdk on NEAR."],
                ["Models", "One OpenAI-compatible adapter; OpenRouter primary, Groq secondary."],
                ["Execution", "Capped NEP-141 vault; 1Click is the primary venue adapter."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-xl border border-line bg-white/[0.02] p-3">
                  <p className="text-[12px] font-extrabold text-ink">{title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">{copy}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              The durable queue runs in-process with a small connection pool. Concurrency is capped
              at one audit and three parallel attackers for a 512 MB instance. See{" "}
              <DocLink href={`${REPO_DOCS}/ARCHITECTURE.md`}>ARCHITECTURE.md</DocLink>.
            </p>
          </Panel>

          <Panel title="Commitments" subtitle="The goalposts are fixed before analysis.">
            <div id="commitments" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                Thesis and condition preimages are normalized, serialized with versioned RFC 8785
                canonical JSON and hashed with SHA-256. The client signs{" "}
                <span className="mono text-ink">commit_audit</span> on NEAR. The backend verifies the
                contract, method, predecessor, audit ID, hashes and finality before the preimage is
                revealed to attackers.
              </p>
              <p>
                A fixed fee quote is issued only after commitment. The client funds the exact quote;
                attacker dispatch happens only after both commitment and funding are verified. A
                committed audit is immutable. Changing conditions requires a new audit.
              </p>
              <div className="notice notice--warn">
                <LockKeyhole size={15} aria-hidden="true" />
                <span>
                  No model receives a wallet or signing capability. The client signer is separate
                  from the adjudicator and the execution agent.
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="Attackers" subtitle="Eight methods, one output contract.">
            <div id="attackers" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                A01–A08 cover liquidity, asset safety, logic, correlation, inversion, provenance,
                timing and base rates. Each run has a separate context, a pinned provider/model and a
                typed evidence grant. Attackers see the committed thesis and conditions; they never
                see sibling outputs, adjudicator state or prior verdicts.
              </p>
              <p>
                Every output contains an assessment for every committed condition exactly once, plus
                a justified Section B search beyond the conditions. Section B cannot be omitted
                without a recorded reason.
              </p>
            </div>
          </Panel>

          <Panel title="Adjudication" subtitle="No majority vote. No model-issued verdict.">
            <div id="adjudication" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                The evidence re-fetch and sycophancy review happen before deterministic adjudication.
                Missing coverage, a material invalid test or unresolved conflict produces{" "}
                <span className="mono">ABSTAIN</span>, never <span className="mono">NOT_HIT</span>. A
                verified critical failure produces <span className="mono">REFUSE</span>.{" "}
                <span className="mono">TRADE</span> requires every positive gate to pass.
              </p>
              <p>
                The policy version and hash are part of the certificate. A later policy change cannot
                rewrite an earlier verdict.
              </p>
            </div>
          </Panel>

          <Panel title="Evidence" subtitle="Typed adapters, server-calculated hashes.">
            <div id="evidence" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                Re-fetch uses a stored typed locator, never a model-supplied URL. Unavailable sources
                are <span className="mono">UNVERIFIABLE</span>; a changed live value is not
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
                SHA-256 hash is registered on the NEAR registry. The public verifier recomputes the
                hash and compares it with the chain record; it never exposes the thesis preimage,
                positions or private evidence.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/app" className="button button--ghost button--small">
                  <Fingerprint size={12} aria-hidden="true" />
                  Browse certificates
                </Link>
                <span className="tag tag--ok">on-chain anchor</span>
                <span className="tag tag--muted">public hash</span>
              </div>
            </div>
          </Panel>

          <Panel title="Execution" subtitle="Separate, capped and disabled by default.">
            <div id="execution" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                The proprietary arm runs the same eight-attacker pipeline. A `TRADE` certificate can
                reach a capped NEP-141 vault only when execution is explicitly enabled. The vault
                holds wNEAR, enforces per-transaction and daily caps, and can transfer only to an
                owner-approved venue quote address with a certificate-bound memo.
              </p>
              <p>
                The primary adapter is NEAR Intents 1Click on mainnet. The agent holds a Function Call
                Key scoped to the vault; the full-access owner key is not in the execution runtime.
                `EXECUTION_ENABLED` and `PROPRIETARY_LOOP_ENABLED` default to `false`.
              </p>
            </div>
          </Panel>

          <Panel title="Security" subtitle="Fail closed for verdict-critical uncertainty.">
            <div id="security" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                Authorization is enforced server-side for every object read and write. Secrets stay
                server-side; API keys are hashed at rest. External data and model output are treated
                as untrusted. There is no arbitrary URL fetch tool, no shell/filesystem access and no
                wallet signing inside an attacker run.
              </p>
              <p>
                The model-family, vendor and open-weight gates remain enforced. See{" "}
                <DocLink href={`${REPO_DOCS}/docs/SECURITY_SPEC.md`}>docs/SECURITY_SPEC.md</DocLink>.
              </p>
            </div>
          </Panel>

          <Panel title="Wallet auth" subtitle="Wallet connect is the only human auth path.">
            <div id="wallet-auth" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                Connect → sign a server-issued nonce → verify the access key through NEAR RPC → set
                an HttpOnly SameSite=Lax session cookie. Nonces are single-use and expire in five
                minutes. The operator allowlist is checked server-side; a client-supplied wallet
                address is never trusted.
              </p>
            </div>
          </Panel>

          <Panel title="API keys" subtitle="Scoped for autonomous agents.">
            <div id="api-keys" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                Client agents use <span className="mono">Authorization: Bearer ds_...</span> keys with
                the scopes <span className="mono">audit:create</span>,{" "}
                <span className="mono">audit:read:own</span>, <span className="mono">audit:commit</span>,{" "}
                <span className="mono">audit:fund</span> and{" "}
                <span className="mono">certificate:read:own</span>. A key is displayed once at
                issuance and stored only as a salted hash. Rotation and revocation are supported.
              </p>
              <p>
                Keys cannot list clients, read another workspace or sign a wallet transaction.
                Authorization is enforced server-side for every object read and write.
              </p>
            </div>
          </Panel>

          <Panel title="Reputation" subtitle="Derived from finalized records only.">
            <div id="reputation" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                Reputation events are append-only and keyed by attacker, audit, event type and
                finding. They are written once from finalized accepted or rejected findings. Replaying
                finalization cannot double-count, and unfinished runs never enter the ledger.
              </p>
            </div>
          </Panel>

          <Panel title="Deployment" subtitle="Preview and production boundaries.">
            <div id="deployment" className="scroll-mt-24" />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                The hosted service runs as a Render web service with a Neon PostgreSQL database. The service
                has no separate background worker; pg-boss runs in-process. Production deployment
                requires operator-owned mainnet registry, vault and payout accounts plus explicit
                release authorization.
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

          <Panel title="Boundaries" subtitle="What this build does not claim.">
            <div id="limitations" className="scroll-mt-24" />
            <ul className="gate-list">
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Wallet session, scoped API keys and server-side authorization are live.
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Eight-attacker dispatch, evidence re-fetch and deterministic adjudication are implemented.
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Certificate hashing and public verification are implemented.
              </li>
              <li className="gate" data-pass="false">
                <CircleAlert aria-hidden="true" />
                Mainnet contract deployment requires operator accounts and explicit release authority.
              </li>
            </ul>
            <p className="mt-4 text-[10px] leading-relaxed text-muted-2">
              No synthetic result is presented as production evidence. Execution is disabled by
              default and is not reachable by an attacker model.
            </p>
          </Panel>

          <div className="panel panel--glow">
            <div className="panel-body flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="small-caps text-muted-2">Repository</p>
                <p className="mt-2 text-[13px] text-muted">
                  Normative specifications, migrations and deployment notes live in the public
                  repository.
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
