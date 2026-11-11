# OPERATOR_INTAKE.md — Consolidated Readiness Check

**Status:** Not yet completed.  
**Rule:** Ask all genuinely required missing questions in one consolidated intake before implementation. Do not re-ask information already supplied in the repository, handoff files, environment, or operator response.

The coding agent must first inspect the repository/environment without modifying files or printing secrets, then populate this document. Values below are current known state; `PENDING` means the agent must verify/ask once.

## A. Product decisions — mostly settled; confirm only material changes

| Input | Current decision | Required? | Status | Used by |
|---|---|---:|---|---|
| Product name | Dissent | Yes | SETTLED | Branding/docs |
| Product one-line | Adversarial audit system for AI trading theses | Yes | SETTLED | Landing/demo |
| Hackathon track | RYO-CHAN Track 1 — Autonomous Agents | Yes | SETTLED | Submission framing |
| User roles | Visitor, Analyst, Operator/Admin, Worker | Yes | SETTLED | Auth/permissions |
| MVP surfaces | Six registry domains; minimum three validated results per verdict | Yes | SETTLED | Attacker orchestration |
| Verdicts | TRADE, REFUSE, ABSTAIN; BLOCKED/INCOMPLETE are run states, not verdicts | Yes | SETTLED | Adjudicator/UI |
| Trade execution | Explicitly prohibited | Yes | SETTLED | Security/release |
| External market data | None in MVP | Yes | SETTLED | Integration scope |
| Live analysis access | Authenticated analyst only | Yes | SETTLED | Auth |
| Demo | Public deterministic fixtures, clearly labelled SIMULATED | Yes | SETTLED | Demo |
| Public certificate sharing | Out of scope for MVP | Yes | SETTLED | Privacy |

Ask the operator only if they request an actual product change.

## B. Repository and Git

| Input | Required? | Current state | Validation | Notes |
|---|---:|---|---|---|
| Existing repository URL/path | Yes | PENDING | Verify read/write access | Preserve compatible existing work |
| Git provider account/team | Yes for remote work | PENDING | Confirm scopes | Never assume public repo |
| Permission to create branch/commit | Yes | PENDING | Record branch policy | Routine implementation commits authorized only if stated |
| Public or private repository | Yes | PENDING | Confirm visibility | Public GitHub footer link only if approved |
| Existing project/domain name | Optional | PENDING | Check repository/docs | Product name already settled |

## C. RYO organizer access — live-analysis blocker

| Input | Required? | Current state | Validation | Authorization boundary |
|---|---:|---|---|---|
| Official RYO developer/API documentation | Yes | PENDING | Inspect current docs | Do not invent endpoints or schemas |
| REST API base URL | Yes | PENDING | HTTPS host and docs match | Fixed architecture selects REST |
| RYO API key/credential | Yes for live runs | PENDING | Test read-only call | Server-only; never print or commit |
| Auth scheme/header | Yes | PENDING | Confirm exact provider docs | Do not guess header name |
| Request and response schemas for seven tools | Yes | PENDING | Capture schema fixtures | Do not assume fields not present |
| Rate limits/quota/timeout | Yes | PENDING | Verify docs/provider | Set bounded retries and concurrency |
| Sandbox/test account | Strongly preferred | PENDING | Run safe read-only call | Preview must use sandbox or fixtures |
| Tool access confirmation | Yes | PENDING | Verify `supported_tokens`, `market_overview`, `scan_market`, `analyze_token`, `deep_analysis`, `compare_tokens`, `check_safety` | `monitor_market_sentiment_shift` is not assumed available |
| External sources | No | Not in MVP | N/A | Any addition requires a spec change/authorization |

## D. OpenAI / model provider — live-analysis blocker

| Input | Required? | Current state | Validation | Authorization boundary |
|---|---:|---|---|---|
| OpenAI API account/key | Yes for live AI runs | PENDING | Server-side test call | Secret; no browser exposure |
| Exact model ID | Yes | PENDING | Test structured output and limits | Do not silently switch model |
| Structured JSON schema support | Yes | PENDING | Validate response contract | Zod validation remains mandatory |
| Provider data-retention terms | Yes | PENDING | Review account/terms | Do not send personal data |
| Per-run budget ceiling | Yes | PENDING | Record amount/currency | Hard stop before exceeding |
| Total project budget ceiling | Yes | PENDING | Record amount/currency | No paid upgrade without approval |
| Max requests/tokens | Yes | PENDING | Set limits | One repair retry maximum |

## E. Database, authentication and hosting

| Input | Required? | Current state | Validation | Authorization boundary |
|---|---:|---|---|---|
| Supabase organization/project | Yes | PENDING | Verify access | Prefer separate preview project |
| Supabase Auth redirect URLs | Yes | PENDING | Verify exact domains | Allowlist only |
| DB runtime/worker/migration roles | Yes | PENDING | Verify least privilege/RLS capability | Never expose migration credential |
| Vercel team/project | Yes for preview | PENDING | Verify deploy rights | Preview deployment only by default |
| Preview domain | Yes for hosted preview | PENDING | Confirm domain and protection | No private URLs in public demo video |
| Render team/service | Yes for API preview | PENDING | Verify deploy/env access | Record service cost and limits |
| Production projects/domains | Optional initially | PENDING | Verify only if provided | Production release not authorized by default |
| Environment-variable storage | Yes | PENDING | Verify secret stores | Never commit `.env` |
| Backup/restore access | Required before production | PENDING | Verify process | No prod release without recovery plan |

## F. Reference images and visual direction — required for final UI

| Input | Required? | Current state | Validation | Notes |
|---|---:|---|---|---|
| At least one UI reference image | Yes before Phase 8 | MISSING | Inspect actual image bytes | No UI image attached to the blueprint; the workflow MD is not a visual reference |
| Asset filename/path | Yes if supplied | PENDING | Record exact path | Never invent |
| Source/ownership/permission | Yes | PENDING | Confirm operator has right to use as reference | Do not copy proprietary assets |
| Desktop/mobile reference variants | Optional | PENDING | Note available sizes | Agent derives responsive layouts if only one image |
| Explicit authorization to generate a reference image | Alternative to supplied image | NOT GRANTED | Must be explicit | Without this, do not generate or claim reference was supplied |
| Visual constraints | Optional | PENDING | Collect with image | Use safe defaults until Phase 8 |

## G. Demo and delivery

| Input | Required? | Current state | Validation | Notes |
|---|---:|---|---|---|
| Demo audience | Yes | PENDING | Record judges/developers/users | Script tone/story |
| Product pronunciation | Recommended | PENDING | Confirm preferred pronunciation | Avoid guessing in narration |
| Required demo journeys | Yes | Proposed: anticipated REFUSE, unanticipated ABSTAIN, certificate verification | Confirm/adjust | Keep <=180 seconds |
| Redaction requirements | Yes | PENDING | Record private info/domains to hide | Never show secrets/account details |
| Output directory | Yes | PENDING | Verify writable path | Store video/script/production notes |
| Public Documentation URL | Optional | PENDING | Verify destination | Footer link only when real |
| Public GitHub URL | Optional | PENDING | Verify public repository | Omit if private/unapproved |

## H. Explicit authorization boundaries

Defaults unless the operator grants more specific authority:

- Preview deployments: allowed only after exact project/domain and spend scope are confirmed.
- Production deployment: **NOT AUTHORIZED**.
- Paid service upgrades/credits: **NOT AUTHORIZED** beyond stated budget.
- Public GitHub repository creation: **NOT AUTHORIZED**.
- Domain/DNS changes: **NOT AUTHORIZED**.
- Destructive DB migrations/data deletion: **NOT AUTHORIZED** without backup and explicit scope.
- Real trading/wallet/financial transactions: **PROHIBITED** by product scope.
- Use of personal or production data in preview/demo: **PROHIBITED**.
- External market-data/news providers: **NOT AUTHORIZED** in MVP.
- Paid Google TTS or paid alternative: **NOT AUTHORIZED**; use free verified option or free permitted fallback.

## I. Intake completion record

```text
Intake completed at (UTC):
Repository inspected:
Git branch/remote:
Reference images verified:
RYO docs/base URL/auth/credential verified:
RYO tool schemas and quotas verified:
OpenAI key/model/structured outputs verified:
Per-run and project cost ceilings:
Supabase project/roles verified:
Vercel preview project/domain verified:
Render preview service verified:
Demo audience/pronunciation/output path:
Production authority:
Other permitted actions:
Critical blockers:
Optional gaps using safe defaults:
Operator confirmation recorded:
```

Do not begin implementation until all critical items are verified or explicitly declared non-blocking with a safe fallback.
