import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole, Network, ShieldOff, Users } from "lucide-react";

import { FixtureBadge, TeeWaiverNotice } from "@/components/fixture-badge";
import { KpiCard, PageHeader, Panel } from "@/components/ui";
import { MODEL_ASSIGNMENTS } from "@/lib/model-assignments";

const METHOD_NOTES: Record<string, string> = {
  LIQUIDITY_EXECUTION:
    "Tests executable depth, route impact and whether the proposed size can clear without moving the market beyond the committed bound.",
  ASSET_SAFETY:
    "Reviews contract permissions, token behavior and asset-specific failure modes that the thesis may have treated as background.",
  LOGIC_COHERENCE:
    "Checks whether the thesis follows from its evidence, whether terms are used consistently and whether the conclusion is overclaimed.",
  CORRELATION_PORTFOLIO:
    "Looks for hidden exposures, shared dependencies and correlated drawdowns across the proposed position and the wider book.",
  THESIS_INVERSION:
    "Builds the strongest case against the thesis, then asks what observable evidence would make that inversion correct.",
  DATA_PROVENANCE:
    "Compares the source, timestamp and derivation of the numbers the thesis relies on. A different source name is not independence by itself.",
  TIMING_MEV:
    "Examines the execution window, transaction path and adversarial ordering risk around the proposed action.",
  BASE_RATE:
    "Tests the thesis against historical base rates, survivorship effects and the reference class the agent implicitly chose.",
};

export default function AttackersPage() {
  const attackers = MODEL_ASSIGNMENTS.attackers;
  const families = new Set(attackers.map((attacker) => attacker.model_family));
  const vendors = new Set(attackers.map((attacker) => attacker.provider));
  const openWeight = attackers.filter((attacker) => attacker.open_weight).length;

  return (
    <>
      <PageHeader
        eyebrow="Attacker roster · preview"
        title="Eight methods."
        accent="One output contract."
        description="Each attacker has a specialist method, a separate run context and a typed tool grant. They share the committed input, not each other's work."
        actions={
          <Link href="/docs#attackers" className="button button--ghost">
            Read the attacker contract
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FixtureBadge />
        <span className="tag tag--ok">Diversity gate passes</span>
        <span className="tag tag--warn">TEE waived</span>
      </div>

      <div className="stat-grid">
        <KpiCard
          label="Attackers"
          value={String(attackers.length)}
          detail="A01–A08, frozen registry"
          icon={<Users size={14} aria-hidden="true" />}
        />
        <KpiCard
          label="Model families"
          value={String(families.size)}
          detail="Distinct families across the roster"
          icon={<Network size={14} aria-hidden="true" />}
        />
        <KpiCard
          label="Inference vendors"
          value={String(vendors.size)}
          detail="OpenRouter + Groq"
          icon={<Network size={14} aria-hidden="true" />}
        />
        <KpiCard
          label="Open-weight"
          value={String(openWeight)}
          detail="GPT-OSS 120B on Groq"
          icon={<CheckCircle2 size={14} aria-hidden="true" />}
        />
      </div>

      <TeeWaiverNotice />

      <div className="mt-4">
        <Panel
          title="Pinned assignments"
          subtitle="Resolved against the live OpenRouter and Groq catalogues. Substitutions are recorded, not silent."
          action={<span className="tag tag--muted">model_assignments.json</span>}
          bodyClassName=""
        >
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Pinned attacker model assignments</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Method</th>
                  <th scope="col">Provider</th>
                  <th scope="col">Model</th>
                  <th scope="col">Family</th>
                  <th scope="col">Open weight</th>
                </tr>
              </thead>
              <tbody>
                {attackers.map((attacker) => (
                  <tr key={attacker.attacker_id}>
                    <td data-label="ID">
                      <span className="mono text-primary">{attacker.attacker_id}</span>
                    </td>
                    <td data-label="Method">
                      <strong>{attacker.name}</strong>
                      <div className="mt-1 font-mono text-[9px] text-muted-2">
                        {attacker.method}
                      </div>
                    </td>
                    <td data-label="Provider">
                      <span className="capitalize">{attacker.provider}</span>
                    </td>
                    <td data-label="Model">
                      <span className="mono text-[10px]">{attacker.model_id}</span>
                    </td>
                    <td data-label="Family">
                      <span className="mono text-[10px]">{attacker.model_family}</span>
                    </td>
                    <td data-label="Open weight">
                      {attacker.open_weight ? (
                        <span className="tag tag--ok">Yes</span>
                      ) : (
                        <span className="text-[10px] text-muted-2">Not claimed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Method contracts" subtitle="Specialists differ by method and source diet, not by temperature.">
          <div className="grid gap-3 sm:grid-cols-2">
            {attackers.map((attacker) => (
              <article key={attacker.attacker_id} className="finding">
                <div className="flex items-center justify-between gap-2">
                  <span className="mono text-[10px] text-primary">{attacker.attacker_id}</span>
                  <span className="tag tag--muted">{attacker.method}</span>
                </div>
                <h3 className="finding-title mt-2">{attacker.name}</h3>
                <p className="finding-body">{METHOD_NOTES[attacker.method]}</p>
              </article>
            ))}
          </div>
        </Panel>

        <div className="rail-stack">
          <Panel title="Isolation contract" subtitle="Enforced at the run boundary.">
            <ul className="gate-list">
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Same committed thesis and visible conditions
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Fresh prompt and context per run
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                No sibling output or adjudicator state
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Typed read-only evidence tools
              </li>
              <li className="gate" data-pass="true">
                <CheckCircle2 aria-hidden="true" />
                Outputs sealed until all runs close
              </li>
            </ul>
            <div className="mt-4 notice notice--info">
              <LockKeyhole size={15} aria-hidden="true" />
              <span>
                No attacker receives a wallet, shell, arbitrary HTTP, SQL, filesystem or
                model-to-model channel.
              </span>
            </div>
          </Panel>

          <Panel title="Attestation boundary" subtitle="Recorded, not implied.">
            <div className="flex items-start gap-3">
              <ShieldOff size={18} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
              <p className="text-[12px] leading-relaxed text-muted">
                The frozen TEE gate is formally waived under the zero-new-spend constraint. The
                model-family and vendor gates remain enforced. The UI does not display a TEE badge
                for any attacker, and the certificate must record the waiver.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
