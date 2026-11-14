import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Network,
  Wallet,
} from "lucide-react";

import { PageHeader, Panel } from "@/components/ui";
import { MODEL_ASSIGNMENTS, MODEL_POLICY, PROVIDER_CONFIG } from "@/lib/model-assignments";

export default function OperatorProvidersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Providers"
        title="Diversity is"
        accent="a hard gate."
        description="One OpenAI-compatible adapter serves both inference vendors. The model-family, vendor and open-weight gates are enforced."
        actions={
          <Link href="/operator" className="button button--ghost">
            <ArrowLeft size={14} aria-hidden="true" />
            Operations
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="tag tag--ok">server-side keys</span>
        <span className="tag tag--muted">diversity gate enforced</span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {Object.entries(PROVIDER_CONFIG).map(([name, provider]) => (
          <Panel key={name} title={name} subtitle={provider.kind}>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[11px] text-muted">
                <Network size={13} aria-hidden="true" />
                Base URL
              </span>
              <span className="mono break-all text-right text-[9px] text-ink">{provider.base_url}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[11px] text-muted">
                <KeyRound size={13} aria-hidden="true" />
                Credential
              </span>
              <span className="tag tag--ok">verified</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-line bg-white/[0.02] p-3">
                <p className="small-caps text-muted-2">RPM</p>
                <p className="mt-1 font-mono text-[12px] text-ink">{provider.rpm ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-line bg-white/[0.02] p-3">
                <p className="small-caps text-muted-2">Daily tier</p>
                <p className="mt-1 font-mono text-[10px] text-ink">
                  {"rpd" in provider ? `${provider.rpd} RPD` : provider.rpd_tier}
                </p>
              </div>
            </div>
            {"tpm" in provider ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="tag tag--muted">{provider.tpm} TPM</span>
                <span className="tag tag--muted">{provider.tpd} TPD</span>
              </div>
            ) : null}
            <p className="mt-3 text-[10px] leading-relaxed text-muted-2">
              {name === "groq"
                ? "Groq TPD is the binding constraint for A02 — roughly two audits per day. The adapter token bucket prevents one audit from exhausting the daily quota."
                : "OpenRouter primary. The per-audit ledger stops at $0.50; no paid fallback may silently replace a configured model."}
            </p>
          </Panel>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel
          title="Pinned attacker assignments"
          subtitle="Every substitution is recorded with the selection reason."
          action={<span className="tag tag--muted">7 families</span>}
          bodyClassName=""
        >
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Pinned model assignments and fallbacks</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Model</th>
                  <th scope="col">Family</th>
                  <th scope="col">Fallbacks</th>
                  <th scope="col">Open weight</th>
                </tr>
              </thead>
              <tbody>
                {MODEL_ASSIGNMENTS.attackers.map((attacker) => (
                  <tr key={attacker.attacker_id}>
                    <td data-label="ID">
                      <span className="mono text-primary">{attacker.attacker_id}</span>
                    </td>
                    <td data-label="Model">
                      <span className="mono text-[10px]">{attacker.model_id}</span>
                    </td>
                    <td data-label="Family">
                      <span className="mono text-[10px]">{attacker.model_family}</span>
                    </td>
                    <td data-label="Fallbacks">
                      <span className="mono text-[10px] text-muted-2">
                        {attacker.fallbacks.length > 0 ? attacker.fallbacks.join(", ") : "none"}
                      </span>
                    </td>
                    <td data-label="Open weight">
                      {attacker.open_weight ? (
                        <span className="tag tag--ok">yes</span>
                      ) : (
                        <span className="text-[10px] text-muted-2">not claimed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="rail-stack">
          <Panel title="Diversity gate" subtitle="Evaluated on every audit.">
            <ul className="gate-list">
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                At least 3 distinct model families
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                At least 2 inference vendors
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                At least 1 open-weight attacker
              </li>
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-line bg-white/[0.02] p-3">
                <p className="small-caps text-muted-2">Families</p>
                <p className="mt-1 font-display text-xl font-bold">7</p>
              </div>
              <div className="rounded-xl border border-line bg-white/[0.02] p-3">
                <p className="small-caps text-muted-2">Vendors</p>
                <p className="mt-1 font-display text-xl font-bold">2</p>
              </div>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-muted-2">
              A fallback that collapses two attackers into the same family cannot count toward a
              TRADE-eligible audit. The assignment file records the pinned choice and the reason.
            </p>
          </Panel>

          <Panel title="Budget guard" subtitle="Hard stop before the provider call.">
            <div className="flex items-start gap-3">
              <Wallet size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-display text-2xl font-bold tracking-tight">
                  ${MODEL_POLICY.per_audit_inference_ceiling_usd.toFixed(2)}
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-2">
                  Per-audit inference ceiling. OpenRouter credit remaining at intake:{" "}
                  <span className="mono text-ink">$7.747</span>. No new card charge is authorized.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="tag tag--muted">max {MODEL_POLICY.max_parallel_attackers} parallel</span>
              <span className="tag tag--muted">max {MODEL_POLICY.max_concurrent_audits} audit</span>
              <span className="tag tag--ok">$0 new spend</span>
            </div>
          </Panel>

          <Panel title="Adapter posture" subtitle="One generic OpenAI-compatible client.">
            <div className="flex items-start gap-3">
              <Network size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed text-muted">
                Both vendors use the same adapter with a configurable base URL. Per-provider token
                buckets are enforced before requests; rate-limit failures back off and never
                substitute a paid provider.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
