# DEMO_VIDEO_PLAN.md — Dissent

**Status:** Planned; video production occurs after MVP E2E functionality gate.  
**Maximum duration:** 180 seconds.  
**Target duration:** 120–150 seconds.

## 1. Demo story

Show the product's distinctive process, not a generic tour:

1. A trading thesis is created from RYO market evidence.
2. Failure criteria are committed before attacker execution.
3. Isolated attackers challenge the thesis without seeing the criteria.
4. One anticipated failure yields REFUSE.
5. A different unanticipated BREAK yields ABSTAIN.
6. The user opens the certificate and verifies the hashes/rule replay.

Use deterministic sample fixtures for a repeatable recording. The UI must visibly label all sample values `SIMULATED`. If a live run is included, explicitly identify it as live and record real source timestamps; never mix simulated and live evidence without labels.

## 2. Proposed 140-second sequence

| Time | Screen/action | Narration purpose |
|---|---|---|
| 0–10s | Landing / product headline | Explain the problem: a convincing thesis should be challenged, not trusted automatically |
| 10–25s | New analysis/sample scenario and evidence snapshot | Establish that evidence is sourced and missing data stays missing |
| 25–45s | Thesis and criteria commitment timeline | Show that criteria are sealed before attacks |
| 45–70s | Attacker matrix with separate findings | Explain distinct surfaces and independent execution |
| 70–90s | REFUSE sample | Show an anticipated registered failure |
| 90–110s | ABSTAIN sample | Show an unanticipated failure that the original criteria did not predict |
| 110–130s | Certificate verification | Show provenance, hashes and deterministic adjudication |
| 130–140s | Final tagline / limitation | Reinforce no real trading and practice-only semantics |

Trim to fit the final product while remaining <=180 seconds.

## 3. Capture plan

- Use Playwright against the deployed preview or a local production build.
- Use a clean browser context with seeded deterministic demo fixtures.
- Set viewport 1440x900 for primary recording; capture a short mobile frame only if it adds clear value.
- Hide browser bookmarks, personal account details, private URLs, devtools, terminal secrets, and operator email.
- Record real UI transitions; do not fake screens or animate actions that do not occur.
- Use stable fixture IDs and reset the demo database between takes.
- Capture cursor and scrolling at a deliberate pace.

## 4. Narration and TTS

Preferred: a genuinely free Google AI voice/TTS option, only after checking current availability, free-tier limits, terms, account eligibility, required credentials, and whether usage incurs charges. Do not assume a paid API key is free.

If unavailable or not authorized, use a genuinely free local TTS option such as Piper or eSpeak NG after checking the selected voice/model license and distribution terms. Record the selected tool, version, voice, license, and any quality compromise.

Narration rules:
- Script must correspond to visible events.
- Use natural sentence lengths and measured delivery.
- Avoid long silences, rushed sections, abrupt cuts, clipping or unexplained transitions.
- Prefer captions/subtitles for important technical phrases.
- Do not claim model certainty, profitability, or real execution.

## 5. Required files and output

At the operator-approved location, save:

- `dissent-demo.mp4` (or agreed container)
- `narration-script.md`
- `capture-notes.md`
- `tts-provider-and-license.md`
- `final-review-checklist.md`

Do not commit a large video to a public repository unless explicitly authorized.

## 6. Final review checklist

- [ ] Duration <=180 seconds.
- [ ] Complete video reviewed from start to finish.
- [ ] Audio is present, intelligible, and synchronized.
- [ ] Narration matches visible screen actions.
- [ ] Captions are accurate where included.
- [ ] No awkward dead air, clipping, rushed speech, or blank transitions.
- [ ] No secrets, tokens, personal data, private repository URLs, or private dashboard URLs.
- [ ] All simulated data is clearly labelled.
- [ ] No real trade/financial execution is implied.
- [ ] File opens and plays successfully.
- [ ] Script and production notes saved beside the video.
