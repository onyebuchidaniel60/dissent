# Troubleshooting

| Symptom | Likely cause | Safe diagnostic | Action |
|---|---|---|---|
| API readiness fails | DB unavailable or migrations missing | Inspect health dependency code and Render logs | Restore DB/config; do not print connection URL |
| Live RYO calls disabled | Missing docs/key/base URL/auth contract | Check configuration status only | Complete RYO section of operator intake |
| RYO response rejected | Schema drift or wrong adapter contract | Compare raw sanitized response with official docs | Update schema/adapter after verification; do not loosen validation blindly |
| Data Gate BLOCK | Required evidence missing/stale/identity mismatch | Inspect report reason codes | Use supported asset/fresh evidence; do not bypass gate |
| Thesis validation fails | Model returned unsupported citation or malformed output | Inspect stored validation report/prompt version | One constrained repair; otherwise incomplete |
| Attacker invalid | Wrong vocabulary/surface/evidence pointer | Inspect validation report | One repair; never convert invalid to NO_BREAK |
| Run remains queued | Worker stopped or job lease issue | Inspect queue status and worker logs | Restart/recover worker; lease expiry handles stale claim |
| Certificate verification fails | Payload/hash mismatch or unsupported schema | Compare canonicalized record and snapshot hashes | Mark not verified; preserve original; do not edit certificate |
| Preview unavailable | Deploy permission/project/environment issue | Inspect deployment logs and access | Continue local work; report exact blocker |
| UI final phase blocked | Reference image missing | Inspect `REFERENCE_ASSETS.md` | Obtain supplied image or explicit generation authorization |
| Demo TTS unavailable | No free eligible Google option/credentials | Verify current terms/quota | Use documented free licensed local fallback |

Never solve a failure by replacing missing evidence with placeholders that look real, weakening authorization, increasing cost without approval, or changing an expected verdict to make a test pass.
