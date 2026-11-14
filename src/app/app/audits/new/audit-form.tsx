"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Hash,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Trash2,
  WalletCards,
} from "lucide-react";

type ConditionDraft = {
  condition_id: string;
  description: string;
  metric: string;
  operator: string;
  threshold: string;
  unit: string;
  severity: string;
};

type Preview = {
  thesisHash: string;
  conditionsHash: string;
  thesisPayload: string;
  conditionsPayload: string;
};

type CreatedDraft = {
  audit_id: string;
  public_audit_id: string;
  status: string;
  thesis_hash: string;
  conditions_hash: string;
  policy_hash: string;
  commitment: {
    contractId: string | null;
    method: string;
    args: Record<string, string>;
  };
};

const DEFAULT_CONDITIONS: ConditionDraft[] = [
  {
    condition_id: "FC-001",
    description: "NEAR spot price remains below USD 2.50 at the evaluation snapshot",
    metric: "PRICE_USD",
    operator: "LT",
    threshold: "2.50",
    unit: "USD",
    severity: "CRITICAL",
  },
  {
    condition_id: "FC-002",
    description: "Executable pool depth supports the proposed notional with under 3% impact",
    metric: "PRICE_IMPACT_PCT",
    operator: "LT",
    threshold: "3",
    unit: "PERCENT",
    severity: "HIGH",
  },
];

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function NewAuditForm() {
  const [title, setTitle] = useState("wNEAR / USDC execution thesis");
  const [asset, setAsset] = useState("nep141:wrap.near");
  const [action, setAction] = useState("SELL");
  const [venue, setVenue] = useState("1Click");
  const [amount, setAmount] = useState("0.01");
  const [unit, setUnit] = useState("wNEAR");
  const [horizon, setHorizon] = useState("1");
  const [horizonUnit, setHorizonUnit] = useState("DAY");
  const [rationale, setRationale] = useState(
    "Sell wNEAR for USDC on 1Click while the executable quote remains within the committed slippage bound, liquidity remains available and USDC stays near peg.",
  );
  const [conditions, setConditions] = useState<ConditionDraft[]>(DEFAULT_CONDITIONS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<Preview | null>(null);
  const [created, setCreated] = useState<CreatedDraft | null>(null);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string>("");

  function updateCondition(index: number, patch: Partial<ConditionDraft>) {
    setConditions((current) =>
      current.map((condition, conditionIndex) =>
        conditionIndex === index ? { ...condition, ...patch } : condition,
      ),
    );
    setPreview(null);
    setStatus("");
  }

  function addCondition() {
    const nextNumber = conditions.length + 1;
    setConditions((current) => [
      ...current,
      {
        condition_id: `FC-${String(nextNumber).padStart(3, "0")}`,
        description: "",
        metric: "PRICE_USD",
        operator: "LT",
        threshold: "",
        unit: "USD",
        severity: "HIGH",
      },
    ]);
    setPreview(null);
    setStatus("");
  }

  function removeCondition(index: number) {
    setConditions((current) => current.filter((_, conditionIndex) => conditionIndex !== index));
    setPreview(null);
    setStatus("");
  }

  function validate(): Record<string, string> {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = "A short audit title is required.";
    if (!asset.trim()) nextErrors.asset = "Identify the asset or pair.";
    if (!venue.trim()) nextErrors.venue = "Identify the execution venue.";
    if (!rationale.trim() || rationale.trim().length < 30) {
      nextErrors.rationale = "Write at least 30 characters of thesis rationale.";
    }
    if (!amount.trim() || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      nextErrors.amount = "Position size must be a positive number.";
    }
    if (!horizon.trim() || Number.isNaN(Number(horizon)) || Number(horizon) <= 0) {
      nextErrors.horizon = "Time horizon must be a positive number.";
    }

    const seen = new Set<string>();
    conditions.forEach((condition, index) => {
      if (!condition.condition_id.trim()) {
        nextErrors[`condition-${index}-id`] = "Condition ID is required.";
      } else if (seen.has(condition.condition_id.trim())) {
        nextErrors[`condition-${index}-id`] = "Condition IDs must be unique.";
      } else {
        seen.add(condition.condition_id.trim());
      }
      if (!condition.description.trim()) {
        nextErrors[`condition-${index}-description`] = "Describe the failure condition.";
      }
      if (!condition.threshold.trim()) {
        nextErrors[`condition-${index}-threshold`] = "A threshold is required.";
      }
      if (!condition.unit.trim()) {
        nextErrors[`condition-${index}-unit`] = "A unit is required.";
      }
    });

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setPreview(null);
      setStatus("Local validation found issues. Fix the highlighted fields.");
      return;
    }

    const thesisPayload = stableStringify({
      title: title.trim(),
      asset: asset.trim(),
      action,
      venue: venue.trim(),
      rationale: rationale.trim(),
      position: { amount: amount.trim(), unit: unit.trim() },
      time_horizon: { value: Number(horizon), unit: horizonUnit },
    });
    const conditionsPayload = stableStringify(
      conditions.map((condition) => ({
        condition_id: condition.condition_id.trim(),
        description: condition.description.trim(),
        metric: condition.metric.trim(),
        operator: condition.operator,
        threshold: condition.threshold.trim(),
        unit: condition.unit.trim(),
        severity: condition.severity,
      })),
    );

    const [thesisHash, conditionsHash] = await Promise.all([
      sha256Hex(thesisPayload),
      sha256Hex(conditionsPayload),
    ]);

    setPreview({ thesisHash, conditionsHash, thesisPayload, conditionsPayload });
    setStatus(
      "Local draft validated. These are browser preview hashes; server canonicalization and on-chain commitment follow after submission.",
    );
  }

  async function createDraft() {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("Local validation found issues. Fix the highlighted fields.");
      return;
    }

    setCreating(true);
    setStatus("");
    try {
      const response = await fetch("/api/v1/ui/audits/prepare", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          thesis: {
            asset: {
              chain: "near",
              asset_id: asset.trim(),
              symbol: unit === "NEAR" ? "NEAR" : unit === "wNEAR" ? "wNEAR" : null,
            },
            action,
            direction: null,
            rationale: rationale.trim(),
            position: { amount: amount.trim(), unit: unit.trim(), notional_usd: null },
            time_horizon: { value: Number(horizon), unit: horizonUnit },
            execution_venue: venue.trim(),
          },
          conditions: conditions.map((condition) => ({
            condition_id: condition.condition_id.trim(),
            description: condition.description.trim(),
            metric: condition.metric.trim(),
            operator: condition.operator,
            threshold: condition.threshold.trim(),
            unit: condition.unit.trim(),
            evaluation_window: { value: 1, unit: horizonUnit },
            severity: condition.severity,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Connect a wallet session before creating a draft."
            : data?.error?.message ?? "Could not create the draft.",
        );
      }
      setCreated(data as CreatedDraft);
      setStatus("Draft created through the session-authenticated console API.");
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : "Could not create the draft.");
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setTitle("wNEAR / USDC execution thesis");
    setAsset("nep141:wrap.near");
    setAction("SELL");
    setVenue("1Click");
    setAmount("0.01");
    setUnit("wNEAR");
    setHorizon("1");
    setHorizonUnit("DAY");
    setRationale(
      "Sell wNEAR for USDC on 1Click while the executable quote remains within the committed slippage bound, liquidity remains available and USDC stays near peg.",
    );
    setConditions(DEFAULT_CONDITIONS);
    setErrors({});
    setPreview(null);
    setCreated(null);
    setStatus("");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="form-grid">
      <div className="form-stack">
        <section className="panel panel--raised">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">01 · The trading proposal</h2>
              <p className="panel-subtitle">
                The thesis is private until commitment. Attackers see the committed preimage and
                conditions, never the client workspace.
              </p>
            </div>
            <span className="tag tag--muted">Draft only</span>
          </div>
          <div className="panel-body stack-md">
            <div className="field">
              <label htmlFor="audit-title">Audit title</label>
              <input
                id="audit-title"
                className="input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "audit-title-error" : undefined}
              />
              {errors.title ? (
                <p id="audit-title-error" className="text-[11px] text-danger">
                  {errors.title}
                </p>
              ) : null}
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="audit-asset">Asset or pair</label>
                <input
                  id="audit-asset"
                  className="input"
                  value={asset}
                  onChange={(event) => setAsset(event.target.value)}
                  aria-invalid={Boolean(errors.asset)}
                />
                {errors.asset ? <p className="text-[11px] text-danger">{errors.asset}</p> : null}
              </div>
              <div className="field">
                <label htmlFor="audit-action">Action</label>
                <select
                  id="audit-action"
                  className="select"
                  value={action}
                  onChange={(event) => setAction(event.target.value)}
                >
                  <option value="BUY">Buy</option>
                  <option value="SELL">Sell</option>
                  <option value="SUPPLY">Supply</option>
                  <option value="BORROW">Borrow</option>
                  <option value="STAKE">Stake</option>
                  <option value="ADD_LIQUIDITY">Add liquidity</option>
                  <option value="REMOVE_LIQUIDITY">Remove liquidity</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="audit-venue">Execution venue</label>
                <input
                  id="audit-venue"
                  className="input"
                  value={venue}
                  onChange={(event) => setVenue(event.target.value)}
                  aria-invalid={Boolean(errors.venue)}
                />
                {errors.venue ? <p className="text-[11px] text-danger">{errors.venue}</p> : null}
              </div>
              <div className="field">
                <label htmlFor="audit-horizon">Time horizon</label>
                <div className="flex gap-2">
                  <input
                    id="audit-horizon"
                    className="input"
                    inputMode="numeric"
                    value={horizon}
                    onChange={(event) => setHorizon(event.target.value)}
                    aria-invalid={Boolean(errors.horizon)}
                  />
                  <select
                    className="select max-w-[110px]"
                    value={horizonUnit}
                    onChange={(event) => setHorizonUnit(event.target.value)}
                    aria-label="Time horizon unit"
                  >
                    <option value="HOUR">Hours</option>
                    <option value="DAY">Days</option>
                    <option value="WEEK">Weeks</option>
                    <option value="MONTH">Months</option>
                  </select>
                </div>
                {errors.horizon ? (
                  <p className="text-[11px] text-danger">{errors.horizon}</p>
                ) : null}
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="audit-amount">Position amount</label>
                <input
                  id="audit-amount"
                  className="input"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  aria-invalid={Boolean(errors.amount)}
                />
                {errors.amount ? <p className="text-[11px] text-danger">{errors.amount}</p> : null}
              </div>
              <div className="field">
                <label htmlFor="audit-unit">Position unit</label>
                <input
                  id="audit-unit"
                  className="input"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="audit-rationale">Thesis rationale</label>
              <textarea
                id="audit-rationale"
                className="textarea"
                value={rationale}
                onChange={(event) => setRationale(event.target.value)}
                aria-invalid={Boolean(errors.rationale)}
                aria-describedby={errors.rationale ? "audit-rationale-error" : "audit-rationale-hint"}
              />
              <p id="audit-rationale-hint" className="field-hint">
                State the causal claim, not just the direction. Attackers will test the premise.
              </p>
              {errors.rationale ? (
                <p id="audit-rationale-error" className="text-[11px] text-danger">
                  {errors.rationale}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="panel panel--raised">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">02 · Committed failure conditions</h2>
              <p className="panel-subtitle">
                Each condition needs a measurable metric, comparator, threshold, unit and evaluation
                window. A malformed test can be challenged as <span className="mono">INVALID_TEST</span>.
              </p>
            </div>
            <button type="button" className="button button--ghost button--small" onClick={addCondition}>
              <Plus size={13} aria-hidden="true" />
              Add condition
            </button>
          </div>
          <div className="panel-body stack-md">
            {conditions.map((condition, index) => (
              <fieldset key={`${condition.condition_id}-${index}`} className="rounded-2xl border border-line p-4">
                <legend className="px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-2">
                  Condition {index + 1}
                </legend>
                <div className="form-row">
                  <div className="field">
                    <label htmlFor={`condition-${index}-id`}>Condition ID</label>
                    <input
                      id={`condition-${index}-id`}
                      className="input"
                      value={condition.condition_id}
                      onChange={(event) => updateCondition(index, { condition_id: event.target.value })}
                      aria-invalid={Boolean(errors[`condition-${index}-id`])}
                    />
                    {errors[`condition-${index}-id`] ? (
                      <p className="text-[11px] text-danger">{errors[`condition-${index}-id`]}</p>
                    ) : null}
                  </div>
                  <div className="field">
                    <label htmlFor={`condition-${index}-severity`}>Severity</label>
                    <select
                      id={`condition-${index}-severity`}
                      className="select"
                      value={condition.severity}
                      onChange={(event) => updateCondition(index, { severity: event.target.value })}
                    >
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="NORMAL">Normal</option>
                    </select>
                  </div>
                </div>

                <div className="field mt-3">
                  <label htmlFor={`condition-${index}-description`}>Failure condition</label>
                  <input
                    id={`condition-${index}-description`}
                    className="input"
                    value={condition.description}
                    onChange={(event) => updateCondition(index, { description: event.target.value })}
                    aria-invalid={Boolean(errors[`condition-${index}-description`])}
                  />
                  {errors[`condition-${index}-description`] ? (
                    <p className="text-[11px] text-danger">
                      {errors[`condition-${index}-description`]}
                    </p>
                  ) : null}
                </div>

                <div className="form-row mt-3">
                  <div className="field">
                    <label htmlFor={`condition-${index}-metric`}>Metric</label>
                    <input
                      id={`condition-${index}-metric`}
                      className="input"
                      value={condition.metric}
                      onChange={(event) => updateCondition(index, { metric: event.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`condition-${index}-operator`}>Comparator</label>
                    <select
                      id={`condition-${index}-operator`}
                      className="select"
                      value={condition.operator}
                      onChange={(event) => updateCondition(index, { operator: event.target.value })}
                    >
                      <option value="LT">Less than</option>
                      <option value="LTE">Less than or equal</option>
                      <option value="EQ">Equal</option>
                      <option value="GTE">Greater than or equal</option>
                      <option value="GT">Greater than</option>
                      <option value="BOOLEAN">Boolean</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>
                </div>

                <div className="form-row mt-3">
                  <div className="field">
                    <label htmlFor={`condition-${index}-threshold`}>Threshold</label>
                    <input
                      id={`condition-${index}-threshold`}
                      className="input"
                      inputMode="decimal"
                      value={condition.threshold}
                      onChange={(event) => updateCondition(index, { threshold: event.target.value })}
                      aria-invalid={Boolean(errors[`condition-${index}-threshold`])}
                    />
                    {errors[`condition-${index}-threshold`] ? (
                      <p className="text-[11px] text-danger">
                        {errors[`condition-${index}-threshold`]}
                      </p>
                    ) : null}
                  </div>
                  <div className="field">
                    <label htmlFor={`condition-${index}-unit`}>Unit</label>
                    <input
                      id={`condition-${index}-unit`}
                      className="input"
                      value={condition.unit}
                      onChange={(event) => updateCondition(index, { unit: event.target.value })}
                      aria-invalid={Boolean(errors[`condition-${index}-unit`])}
                    />
                    {errors[`condition-${index}-unit`] ? (
                      <p className="text-[11px] text-danger">{errors[`condition-${index}-unit`]}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    className="button button--danger button--small"
                    onClick={() => removeCondition(index)}
                    disabled={conditions.length === 1}
                  >
                    <Trash2 size={12} aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </fieldset>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="button button--ghost">
            <Hash size={15} aria-hidden="true" />
            Validate & preview hashes
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={createDraft}
            disabled={creating}
          >
            <ShieldCheck size={15} aria-hidden="true" />
            {creating ? "Creating draft…" : "Create draft in console"}
          </button>
          <button type="button" className="button button--ghost" onClick={resetForm}>
            Reset draft
          </button>
          <Link href="/app/audits" className="button button--quiet">
            Cancel
          </Link>
        </div>

        <div aria-live="polite" className="min-h-6">
          {status ? (
            <div className={`notice ${preview ? "notice--info" : "notice--warn"}`}>
              {preview ? (
                <CheckCircle2 size={15} aria-hidden="true" />
              ) : (
                <CircleAlert size={15} aria-hidden="true" />
              )}
              <span>{status}</span>
            </div>
          ) : null}
        </div>
      </div>

      <aside className="rail-stack">
        <section className="panel panel--glow">
          <div className="panel-body">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              Commitment sequence
            </span>
            <ol className="mt-4 grid gap-4">
              {[
                ["Prepare", "Validate typed thesis and conditions. Canonicalize and hash."],
                ["Commit", "Client signs commit_audit on NEAR."],
                ["Fund", "Client pays the fixed quote into escrow."],
                ["Dispatch", "Only then do the eight isolated attackers start."],
              ].map(([label, copy], index) => (
                <li key={label} className="flex gap-3">
                  <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-red text-[10px] text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[12px] font-extrabold text-ink">{label}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">{copy}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-5 notice notice--warn">
              <LockKeyhole size={15} aria-hidden="true" />
              <span>
                Validating hashes locally. Creating a draft calls the session-authenticated console API,
                but does not sign a wallet transaction, commit conditions or move funds.
              </span>
            </div>
          </div>
        </section>

        <section className="panel panel--raised">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Hash preview</h2>
              <p className="panel-subtitle">
                Browser-only stable serialization. Not the committed RFC 8785 artifact.
              </p>
            </div>
            <Hash size={16} className="text-primary" aria-hidden="true" />
          </div>
          <div className="panel-body">
            {preview ? (
              <div className="stack-md">
                <div className="hash-box">
                  <span className="hash-label">Thesis preview hash</span>
                  <span className="hash-value">{preview.thesisHash}</span>
                </div>
                <div className="hash-box">
                  <span className="hash-label">Conditions preview hash</span>
                  <span className="hash-value">{preview.conditionsHash}</span>
                </div>
                <div className="notice notice--info">
                  <ShieldCheck size={15} aria-hidden="true" />
                  <span>
                    Server-side RFC 8785 canonicalization, version pinning and NEAR commitment arrive
                    in Phase 3.
                  </span>
                </div>
              </div>
            ) : (
              <div className="empty-state !px-0 !py-6">
                <span className="empty-icon">
                  <Hash size={18} aria-hidden="true" />
                </span>
                <p className="empty-title">No preview yet</p>
                <p className="empty-copy">
                  Fill the proposal and at least one measurable condition, then validate the draft.
                </p>
              </div>
            )}
          </div>
        </section>

        {created ? (
          <section className="panel panel--glow">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Draft created</h2>
                <p className="panel-subtitle">
                  Stored in your workspace with canonical RFC 8785 hashes.
                </p>
              </div>
              <span className="tag tag--ok">{created.status}</span>
            </div>
            <div className="panel-body">
              <div className="stack-md">
                <div className="hash-box">
                  <span className="hash-label">Audit ID</span>
                  <span className="hash-value">{created.audit_id}</span>
                  <span className="hash-label mt-2">Public audit ID</span>
                  <span className="hash-value">{created.public_audit_id}</span>
                </div>
                <div className="hash-box">
                  <span className="hash-label">Thesis hash (server)</span>
                  <span className="hash-value">{created.thesis_hash}</span>
                  <span className="hash-label mt-2">Conditions hash (server)</span>
                  <span className="hash-value">{created.conditions_hash}</span>
                </div>
                <div className="notice notice--info">
                  <LockKeyhole size={15} aria-hidden="true" />
                  <span>
                    Next: sign <span className="mono">commit_audit</span> with the client wallet.
                    The commitment must be final before funding or attacker dispatch.
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="panel panel--raised">
          <div className="panel-body">
            <div className="flex items-center gap-2">
              <WalletCards size={15} className="text-primary" aria-hidden="true" />
              <h2 className="panel-title">Client signing</h2>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              The deterministic E2E path uses an agent-supplied signed transaction from the
              configured client account. Wallet-selector support is present for manual use; the
              headless test does not automate a browser extension.
            </p>
            <Link href="/docs#wallet-auth" className="button button--ghost button--small mt-4">
              Read the auth design
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </aside>
    </form>
  );
}
