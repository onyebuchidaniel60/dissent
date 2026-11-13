# Configuration Reference

The authoritative list is `.env.example` generated during Phase 2. All secrets are server-only. Environment names below define the expected configuration contract; exact optional vendor fields may be added when SDKs are pinned.

| Variable | Required | Exposure | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | Server secret | PostgreSQL connection |
| `AUTH_SECRET` | Yes | Server secret | Session/auth signing |
| `APP_BASE_URL` | Yes | Public config | Canonical web origin |
| `NEAR_NETWORK` | Yes | Server config | Must equal `testnet` for MVP |
| `NEAR_RPC_URL` | Yes | Server config | Testnet RPC endpoint |
| `NEAR_REGISTRY_ACCOUNT_ID` | Yes | Server config | Deployed registry contract |
| `NEAR_RELAYER_ACCOUNT_ID` | If relayer used | Server config | Approved backend relayer identity |
| `NEAR_RELAYER_PRIVATE_KEY` | If relayer used | Secret manager only | Testnet-only relayer key; never prompt/tool context |
| `NEAR_CLIENT_SIGNING_MODE` | Yes | Server config | `CLIENT_WALLET` or approved client-submitted transaction path |
| `OPENAI_API_KEY` | Yes if assigned | Secret manager only | Provider A credential |
| `ANTHROPIC_API_KEY` | Yes if assigned | Secret manager only | Provider B credential |
| `NEAR_AI_KEY` | Yes for TEE model | Secret manager only | NEAR AI Cloud credential |
| `NEAR_AI_VERIFIER_CONFIG` | Yes for TEE model | Server config/file reference | Verification trust-root config reference |
| `MODEL_ASSIGNMENTS_PATH` | Yes | Server config | Frozen model assignment file |
| `MAX_COST_PER_AUDIT_USD` | Yes | Server config | Hard inference budget ceiling |
| `MAX_DAILY_INFERENCE_USD` | Yes | Server config | Global daily ceiling |
| `PG_BOSS_SCHEMA` | Optional | Server config | Queue schema override |
| `REDSTONE_API_KEY` | If adapter uses it | Secret manager only | RedStone adapter credential |
| `PIKESPEAK_API_KEY` | If adapter uses it | Secret manager only | Pikespeak adapter credential |
| `NEARBLOCKS_API_KEY` | Optional | Secret manager only | NearBlocks adapter credential |
| `FASTNEAR_API_KEY` | Optional | Secret manager only | FastNear adapter credential |
| `PREVIEW_ACCESS_PASSWORD` | Optional | Secret manager only | Protect non-public preview |
| `SENTRY_DSN` | Optional | Server secret/public DSN policy | Error reporting; enable only after review |
| `DEMO_MODE` | Yes | Server config | Distinguishes synthetic fixture mode from live mode |
| `GOOGLE_AI_TTS_KEY` | Optional | Secret manager only | Free-tier TTS only after quota/terms verification |

Client-safe variables must use the framework's explicit public prefix and contain only non-sensitive values such as `NEXT_PUBLIC_APP_NAME`. Never expose provider API keys, NEAR signer keys, database URLs or auth secrets to the browser.
