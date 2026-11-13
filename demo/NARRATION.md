# Dissent — Demo Narration

**Status:** final narration used in `demo/dissent-demo.mp4`.
**Voice:** ElevenLabs library voice was blocked by `paid_plan_required` on the free tier. The delivered video uses the public-domain local Piper `en_US-ljspeech-high` fallback. See `demo/PRODUCTION_NOTES.md` for the exact blocker and the operator action needed to regenerate with the requested voice.
**Target:** 100–140 seconds; hard limit 180 seconds.

## Segments

### S1 — Problem

Autonomous trading agents can make financial decisions faster than humans can supervise them. But an agent should not be the only judge of its own thesis.

### S2 — Solution

Dissent is an adversarial audit protocol for AI trading agents. It commits the failure conditions first, then sends eight isolated attackers to break the thesis.

### S3 — Live commitment

This is a real testnet audit. The thesis and its failure conditions were committed on NEAR before any attacker saw them. Every attacker must assess every condition exactly once, and search beyond them.

### S4 — Attackers

The eight specialists use seven model families across two vendors. They work in separate contexts. The TEE sub-clause is waived under the zero-spend constraint, and the certificate records that deviation rather than hiding it.

### S5 — Evidence and adjudication

Evidence is re-fetched through fixed adapters. A missing source becomes unverifiable, never a negative result. The deterministic adjudicator evaluates coverage, verified evidence and unresolved disagreement — not a majority vote.

### S6 — Live result

This live audit passed all eight gates and returned TRADE. The certificate preserves the full coverage table and minority findings. Its hash matches the NEAR registry.

### S7 — Fixture disclosure

The fixture result surface shows a controlled invalid test and preserved disagreement. It is labelled as a deterministic fixture, never presented as a live model run.

### S8 — Bounty and close

Accepted findings are allocated on testnet, and disagreement remains visible. Dissent turns adversarial review into an auditable safety layer for autonomous finance.

## Timing

Measured from the delivered audio:

| Segment | Start | Duration | End |
|---|---:|---:|---:|
| S1 | 1.000 | 9.875 | 10.875 |
| S2 | 11.475 | 10.757 | 22.232 |
| S3 | 22.832 | 11.692 | 34.524 |
| S4 | 35.124 | 14.223 | 49.347 |
| S5 | 49.947 | 14.618 | 64.564 |
| S6 | 65.164 | 10.682 | 75.846 |
| S7 | 76.446 | 10.896 | 87.342 |
| S8 | 87.942 | 10.304 | 98.247 |

Delivered video: 100.08 seconds. Machine-readable timing is in `demo/timings.json`.
