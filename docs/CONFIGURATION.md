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
| `ADMIN_WALLET_ADDRESSES` | Yes | Server config | Comma-separated operator allowlist |
| `NEAR_NETWORK` | Yes | Server config | Must equal `testnet` for MVP |
| `NEAR_RPC_URL` | Yes | Server config | Testnet RPC endpoint |
| `NEAR_DEPLOYER_ACCOUNT_ID` | Yes | Server config | Testnet deployer identity |
| `NEAR_DEPLOYER_KEY` | Phase 3 | Secret manager only | Testnet deployer key; never prompt/tool context |
| `NEAR_REGISTRY_ACCOUNT_ID` | Phase 3 | Server config | Deployed registry contract |
| `NEAR_ESCROW_ACCOUNT_ID` | Phase 3 | Server config | Set to the registry account; escrow logic is a module in the registry contract |
| `NEAR_RELAYER_ACCOUNT_ID` | If relayer used | Server config | Approved backend relayer |
| `NEAR_RELAYER_KEY` | If relayer used | Secret manager only | Testnet-only relayer key |
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
| `DEMO_MODE` | Yes | Server config | Distinguishes fixtures from live runs |
| `LOG_LEVEL` | Optional | Server config | Pino level |

`RENDER_API_KEY` is a deploy-time shell credential. It is not an application runtime variable and must never be logged or committed.

Client-safe variables must use the framework's explicit public prefix and contain only non-sensitive values. Never expose provider keys, NEAR signer keys, database URLs or auth secrets to the browser.

## Provider limits

- **OpenRouter:** 20 RPM configured token bucket; per-audit ledger ceiling $0.50. Free-model availability and rate limits vary. No paid fallback for a `:free` slug.
- **Groq:** 30 RPM, 8K TPM, 1,000 RPD, 200K TPD. TPD is the binding constraint for A02 (~2 audits/day). The adapter uses a per-provider token bucket so one audit cannot exhaust the day.
- **NearBlocks:** public API rate limits documented at request time; no key is assumed.
- **FastNEAR:** public RPC; no key is assumed for the preview.

## Proprietary execution (Phase 10)

| Variable | Default | Notes |
|---|---|---|
| `NEAR_VAULT_ACCOUNT_ID` | `vault.dissent-demo.testnet` | Capped testnet vault |
| `NEAR_VAULT_AGENT_ACCOUNT_ID` | `vault-agent.dissent-demo.testnet` | Execution agent identity |
| `NEAR_VAULT_AGENT_KEY` | empty | Function Call Key scoped to `spend_as` and `spend_ft_as`; never a full-access key |
| `TIDEPOOL_BASE_URL` | `https://www.usetidepool.tech` | Tidepool testnet API |
| `TIDEPOOL_DEPOSIT_ADDRESS` | per quote | Tidepool wNEAR/USDC quote deposit address |
| `TIDEPOOL_WNEAR_TOKEN_ID` | `wnear.tidepool-sandbox.testnet` | Fixed NEP-141 token in the vault |
| `VAULT_SUPPORTS_NEP141` | `false` | Must be `true` before wNEAR execution |
| `EXECUTION_ENABLED` | `false` | Must be explicitly `true` for a testnet execution |
| `PROPRIETARY_LOOP_ENABLED` | `false` | Enables the 5-minute pg-boss loop |
| `VAULT_PER_TX_CAP_YOCTO` | `500000000000000000000000` | 0.5 NEAR |
| `VAULT_DAILY_CAP_YOCTO` | `1000000000000000000000000` | 1 NEAR |
| `PROPRIETARY_THESIS_AMOUNT_YOCTO` | `10000000000000000000000` | 0.01 wNEAR thesis position for execution |
| `PROPRIETARY_RECIPIENT` | `demo-client.testnet` | Destination for the USDC leg of the quote |
| `PROPRIETARY_EXECUTION_AUDIT_ID` | empty | Per-run gate: only this audit may execute |

Tidepool is reachable. The vault holds Tidepool test wNEAR and exposes `spend_ft_as`; execution remains gated by `PROPRIETARY_EXECUTION_AUDIT_ID`, an approved certificate, an allowlisted quote deposit address, a TRADE verdict and `EXECUTION_ENABLED=true`. Do not enable execution for a client audit or fake a trade.
