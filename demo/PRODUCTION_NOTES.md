# Dissent — Demo Production Notes

## Output

- File: `demo/dissent-demo.mp4`
- Duration: **100.08 seconds** (target 90–150; hard max 180)
- Resolution: 1280×720
- Codecs: H.264 video + AAC stereo audio, 44.1 kHz
- Size: 4,200,670 bytes
- SHA-256: `0f86840bf291e53267bd502bf5db403d144f3434ab7fba5fe01d4a6597cff79a`
- Captions: burned in from the final narration text, maximum two lines per cue
- Narration timing source: `demo/timings.json`

## Voice — blocked ElevenLabs request and free fallback

The operator-supplied ElevenLabs voice ID was attempted first with the operator's existing free-tier credential. The API returned:

```json
{"detail":{"type":"payment_required","code":"paid_plan_required","message":"Free users cannot use library voices via the API. Please upgrade your subscription to use this voice.","status":"payment_required"}}
```

No charge was incurred and no plan/card change was made. The supplied voice is a library voice that the free plan does not permit through the API.

**Fallback used:** local Piper `piper-tts 1.8.0`, model `en_US-ljspeech-high` (LJSpeech dataset, public domain). Piper is MIT-licensed; the voice dataset is public domain. The model was run locally, so no TTS service charge was incurred.

- Piper source: `https://github.com/OHF-Voice/piper1-gpl` (package `piper-tts`)
- Voice model: `https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/ljspeech/high`
- Voice dataset license: public domain (LJSpeech)

**Operator action to use the requested ElevenLabs voice:** upgrade the ElevenLabs plan so library voices are API-accessible, or supply a free-tier-compatible voice ID. Re-run the segment generation and capture scripts; the script text and timing structure are already in `demo/NARRATION.md` and `demo/timings.json`.

## Music

- Title: **Floating Cities**
- Artist: **Kevin MacLeod**
- Source: `https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600018`
- License: **Creative Commons Attribution 4.0 (CC BY 4.0)**
- Use: ambient bed, no vocals, trimmed to the video duration
- Mix: music at volume `0.1` (approximately −20 dB relative to the voice), 1.5s fade-in, 2s fade-out
- Attribution is included in the README and in this file.

## Build commands (summary)

```bash
# narration segments
/tmp/opencode/piper-venv/bin/piper \
  -m /tmp/opencode/piper-ljspeech/en_US-ljspeech-high.onnx \
  -f S1.wav --length-scale 0.96 --sentence-silence 0.25 <<< "Segment text"

# voice concat: 1.0s intro + 0.6s gaps + 0.5s outro
ffmpeg -f concat -safe 0 -i list.txt -c copy voice.wav

# music mix
ffmpeg -i voice.wav -i Floating_Cities.mp3 \
  -filter_complex "[1:a]atrim=0:99.35,volume=0.1,afade=t=in:d=1.5,afade=t=out:st=97.2:d=2[bg];[0:a]volume=1.0[v];[v][bg]amix=inputs=2:duration=longest:dropout_transition=2" \
  -t 99.35 -c:a aac -b:a 192k demo/audio-final.m4a

# captions + mux
ffmpeg -i video-silent.mp4 -i demo/audio-final.m4a \
  -filter_complex "subtitles=demo-captions.srt:force_style='FontName=DejaVu Sans,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BorderStyle=1,Outline=1,Shadow=0.5,MarginV=26,Alignment=2'" \
  -c:v libx264 -preset medium -crf 21 -pix_fmt yuv420p -c:a aac -b:a 192k \
  -movflags +faststart -shortest demo/dissent-demo.mp4
```

## Segment timing

| Segment | Start | Duration | Content |
|---|---:|---:|---|
| S1 | 1.000s | 9.875s | Problem: agents judging their own thesis |
| S2 | 11.475s | 10.757s | Dissent as the adversarial audit protocol |
| S3 | 22.832s | 11.692s | Real testnet commitment and attacker coverage |
| S4 | 35.124s | 14.223s | Seven families / two vendors / TEE waiver |
| S5 | 49.947s | 14.618s | Evidence re-fetch and deterministic adjudication |
| S6 | 65.164s | 10.682s | Eight gates, TRADE, certificate hash |
| S7 | 76.446s | 10.896s | Fixture disclosure: invalid test and dissent |
| S8 | 87.942s | 10.304s | Bounty accounting and closing |

The capture script (`demo/record-segments.mjs`) uses these measured durations; each scene is cut to its segment length and concatenated with the same 0.6s gaps. Video and audio both end at approximately 99–100 seconds.

## Review

- Full file decoded successfully; H.264/AAC streams present.
- Duration 100.08s, under the 180s hard limit.
- Captions sampled at 5s, 30s, 55s, 75s; maximum two lines, bottom third.
- Audio volume: mean −22.9 dB, max −3.7 dB; no clipping.
- No API keys, private keys or operator email addresses appear.
- Testnet account IDs `dissent-demo.testnet`, `demo-client.testnet` and `payout.dissent-demo.testnet` may appear; they are testnet-only and intentionally part of the demo.
- Live audit and certificate shown are real testnet records; the fixture result surface is labelled `DEMO FIXTURE`.
- Sync reviewed against the measured segment table; no drift greater than 300ms observed at the sampled boundaries.

## Known limitations

- The requested ElevenLabs voice could not be used on the free tier. The fallback voice is public-domain Piper/LJSpeech, not the operator's selected voice.
- The demo uses local UI capture against the same application build and Neon data; the public preview URL is recorded in `AI_HANDOFF.md`.
- Background music is CC BY 4.0 and must retain attribution if the video is republished.
