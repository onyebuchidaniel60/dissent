# Dissent — Product Demo Video Plan

**Length:** Target 90–150 seconds; hard limit 180 seconds.  
**Capture:** Playwright browser automation using deterministic data.  
**Voice:** Free Google AI voice/TTS if currently available within quota/terms; otherwise genuinely free permitted fallback. No spend without intake authorization.

## Story beats and target timing

| Time | Visual | Narration purpose |
|---|---|---|
| 0–12s | Product/overview | State Dissent's purpose: adversarial audit before an agent acts |
| 12–28s | Thesis + conditions form and hash | Show precommitment and explain the client cannot move goalposts |
| 28–48s | Eight attacker run statuses | Show methods/model families and sibling isolation |
| 48–68s | Divergent Section A + `INVALID_TEST` | Show a real disagreement and challenge to the client's test |
| 68–88s | Section B finding + evidence re-fetch | Show a new risk and how the source is rechecked |
| 88–112s | Coverage table + verdict + dissent | Show no-majority adjudication and preserved minority result |
| 112–130s | NEAR certificate verify | Show on-chain hash and independent verification |
| 130–145s | Bounty/reputation testnet record | Explain accepted findings and internal agent incentives |

The beat timing is flexible; keep total runtime <=180 seconds. Never show a live feature if the recording uses fixture data; display `DEMO FIXTURE` labels on screen and say the run is a fixture where applicable.

## Production steps
1. Freeze deterministic demo audit ID and fixture dataset; reset test DB.
2. Create a clean browser profile with no personal accounts/passwords.
3. Use Playwright script to walk through exact routes and capture stable viewport, with animations reduced.
4. Record narration script against actual UI states; do not narrate future/hidden outputs.
5. Check Google AI TTS availability, free-tier limits, terms, credential and quota; no unlimited-free assumption.
6. If unavailable, use an openly licensed/free permitted local TTS, document its license and substitution.
7. Generate audio segments and align to screen actions; avoid dead air, overlaps, clipping and unnatural speed.
8. Add burned-in captions where feasible; ensure contrast/readability.
9. Redact private URLs, wallet account identifiers where not intended, API keys, emails and personal data.
10. Render to `demo/dissent-demo.mp4`, save script to `demo/NARRATION.md` and production log to `demo/PRODUCTION_NOTES.md`.
11. Play the entire rendered file; verify audio/video decode, sync, captions, no redactions missed, and `duration <= 180s`.
12. Record file hash, duration, resolution, capture commit and review result in `AI_HANDOFF.md`.

## Narration script draft

“Autonomous trading agents can make financial decisions faster than humans can supervise them. But an agent should not be the only judge of its own thesis. Dissent is an adversarial audit protocol for AI trading agents.

A client submits a thesis and defines the conditions that would invalidate it. Dissent commits those conditions on NEAR before the analysis begins, so the goalposts cannot move afterward.

Eight specialist attackers independently challenge the thesis. They can see the committed conditions, but never each other's findings. Every attacker must assess the conditions and search for risks beyond them.

The Evidence Auditor re-fetches the underlying data. The Sycophancy Auditor checks whether the attackers genuinely challenged the thesis. The adjudicator does not count votes: it evaluates verified evidence, coverage and unresolved disagreement.

The result is TRADE, REFUSE or ABSTAIN. The certificate preserves the coverage table and minority findings, and its hash is anchored on NEAR. Dissent turns disagreement into an auditable safety mechanism for autonomous financial agents.”

Use only the lines supported by the actual capture. If a beat is fixture-driven, explicitly call it a deterministic demo fixture rather than a live provider run.
