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
