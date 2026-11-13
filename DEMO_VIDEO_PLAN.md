# Dissent — Product Demo Video Plan

> **Production status:** delivered 2026-11-13. The operator-supplied ElevenLabs library voice returned `paid_plan_required` on the free tier; no charge was made. The delivered video uses a public-domain Piper/LJSpeech fallback. See `demo/PRODUCTION_NOTES.md` for evidence and the operator action needed to regenerate with the requested voice.

**Length:** Target 90–150 seconds; hard limit 180 seconds.  
**Capture:** Playwright at **1280×720**, deterministic demo data, clean browser profile, service warmed for ~2 minutes. Render free cold starts can take ~50 seconds; never record a cold service.  
**Voice:** **ElevenLabs**, using the exact operator-supplied `ELEVENLABS_VOICE_ID` for every segment. Do not substitute a default voice.  
**Music:** Royalty-free instrumental from Pixabay Music, Free Music Archive or Incompetech; prefer CC0 or CC BY. Ambient/cinematic, no vocals, no percussion stabs. Credit the source, title, artist and license in `demo/PRODUCTION_NOTES.md` and the README “Music attribution” section.

## Story structure

| Time | Visual | Narration purpose |
|---|---|---|
| 0–15s | Product/overview, problem statement | Open with the risk: an autonomous agent should not be the only judge of its own thesis. No title card longer than 2 seconds. |
| 15–30s | Dissent as the solution | Introduce commitment, eight isolated attackers and evidence-backed adjudication. |
| 30–120s | Thesis + conditions → commit → eight attackers → divergence/INVALID_TEST → Section B → evidence re-fetch → coverage + verdict + dissent → NEAR certificate → bounty/reputation | Walk the product flow with visible supporting action for every sentence. |
| 120–150s | Closing frame | What this means for autonomous agents: disagreement becomes an auditable safety mechanism. |

## Production steps

1. Freeze the deterministic demo audit ID and fixture dataset; reset the demo database.
2. Use a clean browser profile with no personal accounts, passwords or extensions.
3. Warm the Render service and verify `/healthz` and `/readyz` before capture.
4. Generate the voiceover **first**, per paragraph. Measure each segment duration.
5. Use the ElevenLabs Python SDK (`pip install elevenlabs`) or REST:
   `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`.
6. Trim leading/trailing silence per segment. Join with 200–400ms gaps, never the model's default silence.
7. If a segment clips or rushes, regenerate at a lower speed. Do not accept clipped audio.
8. Time the Playwright script to the measured narration. Do not rush UI to keep up with audio, and do not pad audio to match slow UI.
9. Every narration sentence must have visible supporting action. No narration over a loading spinner or blank screen.
10. Record the product flow at 1280×720 with reduced motion where appropriate.
11. Add burned-in captions generated from the actual narration text (not auto-transcription). ≤2 lines, bottom third, contrast-checked, safe margins for mobile crop.
12. Select royalty-free music; document source URL, title, artist and license.
13. Mix music at approximately **−20 dB** below voice. Rule: if the melody is audible over a spoken word, turn it down.
14. Fade music in 1.5s and out 2s. Example:
    ```bash
    ffmpeg -i voice.wav -i music.wav \
      -filter_complex "[1:a]volume=0.1,afade=t=in:d=1.5,afade=t=out:st=<end-2>:d=2[bg];[0:a][bg]amix=inputs=2:duration=longest:dropout_transition=2" \
      -c:a aac -b:a 192k demo/audio-final.m4a
    ```
15. Verify the final mix by ear before muxing with video.
16. Render to `demo/dissent-demo.mp4` (H.264 + AAC, 1280×720, ≤180s, ≤50MB target).
17. Play the entire rendered file. Verify audio/video decode, sync within 300ms, captions, redactions, no missed secrets, and duration ≤180s.
18. Record file hash, duration, resolution, capture commit and review result in `AI_HANDOFF.md`.

## Honesty and redaction

- Label any fixture-driven beat `DEMO FIXTURE` on screen and say it is a deterministic fixture in narration.
- State clearly that **TEE attestation is waived** under the zero-new-spend constraint. Do not imply confidential inference or show a TEE badge.
- Never show a live feature if the recording uses fixture data.
- Blur or replace API keys, wallet private keys, admin wallet addresses, emails, private URLs and any real operator account.
- Demo testnet addresses (`dissent-demo.testnet`, `demo-client.testnet`) may appear unblurred; they are testnet-only and part of the demo.
- Do not expose a private repository or a secret-bearing URL.

## Narration script draft

> Autonomous trading agents can make financial decisions faster than humans can supervise them. But an agent should not be the only judge of its own thesis.
>
> Dissent is an adversarial audit protocol for AI trading agents. A client submits a thesis and defines the conditions that would invalidate it. Dissent commits those conditions on NEAR before the analysis begins, so the goalposts cannot move afterward.
>
> Eight specialist attackers independently challenge the thesis. They can see the committed conditions, but never each other's findings. Every attacker must assess the conditions and search for risks beyond them.
>
> The Evidence Auditor re-fetches the underlying data. The Sycophancy Auditor checks whether the attackers genuinely challenged the thesis. The adjudicator does not count votes: it evaluates verified evidence, coverage and unresolved disagreement.
>
> The result is TRADE, REFUSE or ABSTAIN. The certificate preserves the coverage table and minority findings, and its hash is anchored on NEAR. Dissent turns disagreement into an auditable safety mechanism for autonomous financial agents.
>
> This build uses commodity inference under a zero-new-spend constraint, so TEE attestation is explicitly waived. The certificate discloses that deviation rather than hiding it.

Use only the lines supported by the actual capture. If a beat is fixture-driven, explicitly call it a deterministic demo fixture rather than a live provider run.

## Output

- `demo/dissent-demo.mp4`
- `demo/NARRATION.md` — final script with per-segment timing
- `demo/PRODUCTION_NOTES.md` — voice ID, music source/license, ffmpeg commands, sync notes, review result
- `demo/audio-final.m4a` (intermediate, gitignored)
