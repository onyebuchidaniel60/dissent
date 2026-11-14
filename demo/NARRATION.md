# Dissent — Final Demo Narration

**Status:** final narration used in `demo/dissent-demo.mp4` (Phase 17).
**Voice:** local Piper `en_US-ljspeech-high` fallback. The operator-supplied ElevenLabs library voice is not API-accessible on the free tier (`paid_plan_required`); no charge was made. See `demo/PRODUCTION_NOTES.md`.
**Length:** 144.2 seconds (hard limit 180 seconds).
**Capture:** 1440×900, Playwright, current preview build and live testnet data.
**Music:** Kevin MacLeod — “Floating Cities” (CC BY 4.0), approximately −20 dB under the voice.

## Segments

### S1 — The problem

Autonomous trading agents can make financial decisions faster than humans can supervise them. But an agent should not be the only judge of its own thesis.

### S2 — The protocol and the commitment

Dissent is an adversarial audit protocol for AI trading agents. A client submits a thesis, and the exact conditions that would prove it wrong. Those conditions are committed on NEAR before any attacker sees them.

### S3 — Eight isolated attackers

Eight isolated specialists attack the thesis. They see the committed conditions, but never each other's findings. Every condition is assessed exactly once, and Section B searches for risks beyond the committed set.

### S4 — Model diversity and the TEE waiver

The roster spans seven model families across two vendors, with an open-weight model and a documented TEE waiver. The certificate records that deviation instead of hiding it.

### S5 — x402 compute procurement

Dissent also pays for its own intelligence. A dedicated agent wallet signs an x402 payment for each A01 and A02 call. The facilitator shim settles the transfer on-chain in test USDC, then forwards the inference request.

### S5B — Agent Economy

This is the Agent Economy: an autonomous agent that can pay for the services it consumes, without a human in the loop.

### S6 — Evidence and deterministic adjudication

Evidence is re-fetched through fixed adapters. A missing source becomes unverifiable, never a negative result. The deterministic adjudicator evaluates coverage, verified evidence, and unresolved disagreement. There is no majority vote.

### S7 — The verdict and the certificate

The result is TRADE, REFUSE, or ABSTAIN. The certificate preserves the complete coverage table, accepted findings, and minority dissent.

### S8 — Public verification

The certificate is hashed and anchored on NEAR. Anyone can recompute the hash and verify it against the registry.

### S9 — The proprietary agent

Dissent is not just a service. It is its own first client. It originated a thesis, audited it, executed it via its vault, and paid for its own AI compute using x402. It is a self-sustaining economic actor.

### S10 — The executed receipt

Here is the historical proprietary run: the vault transfer, the Tidepool settlement, and the execution receipt preserved in the certificate.

### S11 — The proprietary verifier

The same public verifier returns VERIFIED, with execution readiness EXECUTED.

### S12 — Closing

Dissent doesn't just judge autonomous agents. It is one.

## Timing

Measured from the delivered audio. Machine-readable timing is in `demo/timings.json`.

| Segment | Start | Duration | End |
|---|---:|---:|---:|
| S1 | 1.500 | 10.205 | 11.705 |
| S2 | 12.255 | 12.967 | 25.222 |
| S3 | 25.772 | 13.420 | 39.192 |
| S4 | 39.742 | 11.052 | 50.794 |
| S5 | 51.344 | 16.984 | 68.328 |
| S5B | 68.878 | 6.885 | 75.763 |
| S6 | 76.313 | 15.323 | 91.636 |
| S7 | 92.186 | 8.939 | 101.125 |
| S8 | 101.675 | 6.722 | 108.397 |
| S9 | 108.947 | 15.730 | 124.677 |
| S10 | 125.227 | 8.255 | 133.481 |
| S11 | 134.031 | 4.876 | 138.907 |
| S12 | 139.457 | 3.749 | 143.207 |

Delivered video: **144.20 seconds**. Captions are burned in from this text; the certificate and x402 evidence shown on screen are the live testnet records described in `README.md`.
