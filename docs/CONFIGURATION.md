# Configuration Reference

All secrets are server-only. The authoritative template is [`.env.example`](../.env.example). Never commit `.env.local`, API keys, wallet keys or Render/Railway tokens.

| Variable | Required | Exposure | Purpose |
|---|---|---|---|
| `NODE_ENV` | Yes | Server config | Runtime mode |
| `APP_BASE_URL` | Yes | Public config | Canonical web origin |
| `NEXT_PUBLIC_APP_NAME` | Optional | Public | Display name only |
| `DATABASE_URL` | Yes | Server secret | Neon pooled PostgreSQL connection |
| `DATABASE_URL_DIRECT` | Yes | Server secret | Neon direct connection for pg-boss |
| `PG_BOSS_SCHEMA` | Optional | Server config | Queue schema override (default `pgboss`) |
| `DISABLE_IN_PROCESS_QUEUE` | Optional | Server config | Set `true` only for isolated tests |
| `AUTH_SECRET` | Yes | Server secret | Session/nonce signing |
| `AUTH_RECIPIENT` | Optional | Server config | NEP-413 recipient; must exactly match `APP_BASE_URL` (URL form) |
| `ADMIN_WALLET_ADDRESSES` | Yes | Server config | Comma-separated operator allowlist |
| `NEAR_NETWORK` | Yes | Server config | `mainnet` (default) or explicit `testnet` for staging |
| `NEXT_PUBLIC_NEAR_NETWORK` | Yes | Public config | Must match `NEAR_NETWORK` for the wallet selector |
| `NEAR_RPC_URL` | Yes | Server config | Mainnet RPC by default; staging may override |
| `NEAR_EXPLORER_URL` | Optional | Public config | `https://explorer.near.org` by default |
| `NEAR_DEPLOYER_ACCOUNT_ID` | Yes | Server config | Operator-owned mainnet identity |
| `NEAR_DEPLOYER_KEY` | Yes | Secret manager only | Operator-owned signer; never prompt/tool context |
| `NEAR_REGISTRY_ACCOUNT_ID` | Yes | Server config | Deployed mainnet registry contract; no testnet fallback |
| `NEAR_ESCROW_ACCOUNT_ID` | Optional | Server config | Registry account; escrow logic is a module in the registry contract |
| `NEAR_RELAYER_ACCOUNT_ID` | If relayer used | Server config | Approved backend relayer |
| `NEAR_RELAYER_KEY` | If relayer used | Secret manager only | Relayer key; never a full-access treasury key |
| `NEAR_CLIENT_SIGNING_MODE` | Yes | Server config | `AGENT_SUPPLIED_TX` for deterministic E2E |
| `OPENROUTER_API_KEY` | Yes | Secret manager only | Primary inference provider |
| `OPENROUTER_BASE_URL` | Yes | Server config | `https://openrouter.ai/api/v1` |
| `GROQ_API_KEY` | Yes | Secret manager only | A02 inference provider |
| `GROQ_BASE_URL` | Yes | Server config | `https://api.groq.com/openai/v1` |
| `MAX_COST_PER_AUDIT_USD` | Yes | Server config | Hard per-audit inference ceiling (`0.50`) |
| `MAX_DAILY_INFERENCE_USD` | Yes | Server config | Daily circuit breaker |
| `MAX_CONCURRENT_AUDITS` | Yes | Server config | `1` on Render free |
| `MAX_PARALLEL_ATTACKERS` | Yes | Server config | `3` on Render free |
| `TEE_VERIFICATION_ENABLED` | Yes | Server config | `false` under the documented waiver |
| `TEE_STATUS` | Yes | Server config | `WAIVED_BUDGET_CONSTRAINT` |
| `FASTNEAR_API_KEY` | Optional | Secret manager only | Public RPC works without a key |
| `NEARBLOCKS_API_KEY` | Optional | Secret manager only | Public API works with rate limits |
| `ELEVENLABS_API_KEY` | Demo | Secret manager only | Voiceover generation only |
| `ELEVENLABS_VOICE_ID` | Demo | Server/demo config | Exact operator-supplied voice |
| `DEMO_MODE` | Yes | Server config | `false` for production; no synthetic data is written as live output |
| `LOG_LEVEL` | Optional | Server config | Pino level |

`RENDER_API_KEY` is a deploy-time shell credential. It is not an application runtime variable and must never be logged or committed.

Client-safe variables must use the framework's explicit public prefix and contain only non-sensitive values. Never expose provider keys, NEAR signer keys, database URLs or auth secrets to the browser.

## Provider limits

- **OpenRouter:** 20 RPM configured token bucket; per-audit ledger ceiling $0.50. Free-model availability and rate limits vary. No paid fallback for a `:free` slug.
- **Groq:** 30 RPM, 8K TPM, 1,000 RPD, 200K TPD. TPD is the binding constraint for A02 (~2 audits/day). The adapter uses a per-provider token bucket so one audit cannot exhaust the day.
- **NearBlocks:** public API rate limits documented at request time; no key is assumed.
- **FastNEAR:** public RPC; no key is assumed for the preview.

## Proprietary execution (mainnet-ready)

| Variable | Default | Notes |
|---|---|---|
| `NEAR_VAULT_ACCOUNT_ID` | empty | Capped vault; operator-supplied mainnet account |
| `NEAR_VAULT_AGENT_ACCOUNT_ID` | empty | Execution agent identity |
| `NEAR_VAULT_AGENT_KEY` | empty | Function Call Key scoped to `spend_as` and `spend_ft_as`; never a full-access key |
| `EXECUTION_VENUE` | `ONECLICK` | `ONECLICK` primary; `TIDEPOOL` only for explicit staging |
| `ONECLICK_BASE_URL` | `https://1click.chaindefuser.com` | Mainnet 1Click API |
| `ONECLICK_API_KEY` | empty | Optional 1Click key; never a wallet key |
| `ONECLICK_ORIGIN_ASSET` | `nep141:wrap.near` | wNEAR origin asset |
| `ONECLICK_DESTINATION_ASSET` | `nep141:17208628...` | Live mainnet USDC asset ID from `/v0/tokens` |
| `ONECLICK_WNEAR_TOKEN_ID` | `wrap.near` | Fixed NEP-141 token in the vault |
| `ONECLICK_DEPOSIT_ADDRESS` | per quote | 1Click quote deposit address; owner must allowlist it |
| `VAULT_SUPPORTS_NEP141` | `false` | Must be `true` before wNEAR execution |
| `EXECUTION_ENABLED` | `false` | Must be explicitly `true` for a mainnet/staging execution |
| `PROPRIETARY_LOOP_ENABLED` | `false` | Enables the 5-minute pg-boss loop |
| `VAULT_PER_TX_CAP_YOCTO` | `500000000000000000000000` | 0.5 NEAR |
| `VAULT_DAILY_CAP_YOCTO` | `1000000000000000000000000` | 1 NEAR |
| `PROPRIETARY_THESIS_AMOUNT_YOCTO` | `10000000000000000000000` | 0.01 wNEAR thesis position for execution |
| `PROPRIETARY_CLIENT_ACCOUNT_ID` | empty | Workspace client that signs `commit_audit` and `fund_audit`; falls back to `DEMO_CLIENT_ACCOUNT_ID` |
| `PROPRIETARY_CLIENT_KEY` | empty | Testnet full-access key for `PROPRIETARY_CLIENT_ACCOUNT_ID`; falls back to `DEMO_CLIENT_KEY` |
| `PROPRIETARY_RECIPIENT` | empty | Destination for the USDC leg of the quote |
| `PROPRIETARY_REFUND_TO` | empty | Refund account for the wNEAR leg; normally the vault |
| `PROPRIETARY_EXECUTION_AUDIT_ID` | empty | Per-run gate: only this audit may execute; the loop sets it at runtime |
| `TIDEPOOL_BASE_URL` | empty | Staging-only testnet venue |
| `TIDEPOOL_DEPOSIT_ADDRESS` | empty | Staging-only quote address |
| `TIDEPOOL_WNEAR_TOKEN_ID` | `wnear.tidepool-sandbox.testnet` | Staging-only fixed token |

`config/preview-network.json` is the explicit preview fallback (testnet RPC, registry, vault, preview URL, Tidepool). Production mainnet requires env values that resolve to `.near`; otherwise the app deliberately falls back to testnet staging.

With `PROPRIETARY_LOOP_ENABLED=true`, `NEAR_DEPLOYER_KEY` and `PROPRIETARY_CLIENT_KEY` (or `DEMO_CLIENT_KEY`), the 5-minute worker originates an audit, signs `commit_audit` and `fund_audit`, prepares the testnet vault approval and token storage, pins `PROPRIETARY_EXECUTION_AUDIT_ID` to the audit, and enqueues dispatch. It resumes `AWAITING_COMMITMENT`, `COMMITTED`, `FUNDED` or `QUEUED` audits instead of creating duplicates, and skips while an audit is attacking or awaiting adjudication. The explicit operator script uses `autoCommit: false` and keeps its own ordering.

Execution is fail-closed: a TRADE certificate alone is not enough. The audit must match `PROPRIETARY_EXECUTION_AUDIT_ID`, the vault must be NEP-141-capable, the quote deposit address must be allowlisted for its window, the certificate must be approved, and `EXECUTION_ENABLED` must be explicitly `true`. The preview uses `NEAR_NETWORK=testnet` and `EXECUTION_VENUE=TIDEPOOL` for the historical staging record; the customer-facing UI does not display a testnet label. Production must use a fresh mainnet database and the mainnet configuration above.
