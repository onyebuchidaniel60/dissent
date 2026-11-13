# Troubleshooting

| Symptom | Likely cause | Safe response |
|---|---|---|
| Audit remains `AWAITING_COMMITMENT` | Client tx missing, wrong signer/hash, or not final | Inspect public receipt metadata; do not dispatch |
| Audit remains `AWAITING_FUNDING` | Quote expired, amount mismatch, or tx not confirmed | Issue a new quote only under policy; never infer payment |
| Attacker provider timeout | Vendor outage/rate limit | Bounded retry; record failure; never synthesize run |
| TEE signature cannot verify | Missing/rotated attestation or gateway-only signature | Mark `TEE_UNVERIFIED`; cannot yield TRADE |
| Evidence re-fetch differs | Source changed or snapshot mismatch | Align observation timestamps/block hash; classify honestly |
| Empty Section B rejected | Inadequate coverage explanation | One bounded follow-up using same inputs; else ABSTAIN |
| Queue job duplicated | Retry/idempotency issue | Inspect unique job keys and audit event log; never duplicate bounty |
| Certificate hash mismatch | Canonicalization/version/serialization drift | Stop public verified claim; preserve both artifacts and diagnose |
| Testnet RPC unavailable | Endpoint issue | Switch only to configured trusted RPC fallback; no mainnet fallback |
| Preview deploy fails | Host/credential/project issue | Continue locally; record exact blocker and commit SHA |

Never fix an incident by mutating a committed audit, weakening a validation gate, logging secrets or retrying financial settlement without idempotency checks.

## Preview-specific checks

| Symptom | Likely cause | Safe response |
|---|---|---|
| `/operator` shows the gate even after connecting | Wallet is not in `ADMIN_WALLET_ADDRESSES`, or the session expired | Reconnect, verify the allowlist, check the session endpoint; do not bypass the server check |
| `readyz` 503 | Neon suspended/unreachable or `DATABASE_URL` missing | Check Neon status, verify Render env injection; `/healthz` should remain 200 |
| pg-boss does not start | Direct Neon URL missing or advisory locks unavailable | Use `DATABASE_URL_DIRECT`; if unavailable, document the pooled URL compatibility setting |
| Funding quote fails | `NEAR_DEPLOYER_KEY` missing or registry account unfunded | Verify the deployer secret is set on Render; never print it |
| Live verify says MISMATCH | Certificate body or registry record changed | Stop; preserve both artifacts; do not claim verification |
| Provider 429 | Free-tier RPM/TPD exhausted | Back off; do not substitute a paid provider silently |
