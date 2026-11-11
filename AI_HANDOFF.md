# AI_HANDOFF.md — Dissent

**Handoff status:** Blueprint complete; implementation has not started.  
**Current phase:** Phase 0 — Operator Intake / Readiness Check.  
**Last updated:** 11 November 2026.

## Source-of-truth files

- `references/PROPER_VIBE_CODING_WORKFLOW_AUTONOMOUS.md` — original operator-supplied methodology, bundled verbatim.

- `PROJECT_SPEC.md`
- `ARCHITECTURE.md`
- `IMPLEMENTATION_PLAN.md`
- `AGENTS.md`
- `OPERATOR_INTAKE.md`
- `REFERENCE_ASSETS.md`
- `DEMO_VIDEO_PLAN.md`

Read all before repository changes.

## Current project state

| Item | Status | Notes |
|---|---|---|
| Product definition | Complete | Dissent; adversarial audit for trading theses |
| MVP scope | Complete | Six attacker domains in registry; minimum three valid findings for a verdict |
| Adjudication rules | Complete | Pure deterministic rules; `TRADE`, `REFUSE`, `ABSTAIN`; blocked/incomplete have no verdict |
| System architecture | Complete | React/Vite, Fastify, Supabase Postgres/Auth, OpenAI Responses, RYO REST, Vercel/Render |
| Data model/API | Specified | See Project Spec and docs |
| Security architecture | Specified | Owner isolation, criteria secrecy, source evidence validation, immutable certificates |
| Repository inspected | Pending | No application repository supplied in current handoff context |
| Operator intake | Pending | See `OPERATOR_INTAKE.md`; ask all missing inputs together |
| RYO developer contract | Pending | Official public catalog reviewed; exact REST details/credentials must be supplied and verified |
| OpenAI credentials/model | Pending | Must verify structured-output support and cost/retention terms |
| Supabase/Vercel/Render access | Pending | Verify access and preview scope |
| UI reference images | Missing | No UI reference image attached; request during initial intake |
| StageShow skill | Not attempted | Must attempt at start of Phase 8, not now |
| Preview URL | Not deployed | Do not invent a URL |
| Deployed commit | None | No repository implementation commit exists |
| Unit/integration/E2E tests | Not run | No application code exists |
| Demo video | Not produced | Produce only after functioning app and E2E gate |
| Production authority | Not granted | Default is preview/staging only |

## Decisions already fixed

- No real trade execution, wallet, custody, transfers, money movement, or P&L claims.
- Current RYO catalog baseline: `market_overview`, `scan_market`, `analyze_token`, `deep_analysis`, `compare_tokens`, `check_safety`, `supported_tokens`.
- Do not assume `monitor_market_sentiment_shift` is available.
- Six modular attacker domains; Data Integrity Gate is deterministic and cross-cutting.
- Backend, not browser, selects active attackers based on registry and actual evidence.
- Attackers receive no criteria, peer findings, verdict, or tool-calling capability.
- Fewer than three valid findings means no verdict.
- LLM never adjudicates.
- Certificates are immutable and verifiable.
- Fixed stack and phase sequence are in `ARCHITECTURE.md` and `IMPLEMENTATION_PLAN.md`.

## Exact preview and release status

- **Preview URL:** Not deployed.
- **Preview commit:** None.
- **Production URL:** Not authorized/not deployed.
- **Release permission:** No production release authority recorded.

## Next task

1. Read the full source-of-truth package and current repository instructions.
2. Inspect repository, Git, existing apps, lockfiles, code, migrations, tests, CI and deployment config without modifying files or printing secrets.
3. Complete one consolidated Operator Intake. Do not ask separate questions phase by phase.
4. Verify actual RYO REST developer documentation, endpoint/auth/parameter/response contracts, API key, quotas, and sandbox access.
5. Verify OpenAI API key, exact model ID, structured-output support, provider retention terms, and run/project cost ceilings.
6. Verify Supabase, Vercel and Render project access and preview-only scopes.
7. Obtain and inspect actual UI reference images, or record explicit operator authorization to generate them.
8. Record all answers and evidence in `OPERATOR_INTAKE.md` and `REFERENCE_ASSETS.md`.
9. Begin Phase 1 only after indispensable inputs and authority are verified. Then run phases continuously without routine approval stops.

## Known blockers

- No repository path/URL and Git permission recorded.
- RYO organizer docs/key/base URL/auth details not attached.
- OpenAI key/model/budget not recorded.
- Supabase/Vercel/Render access not recorded.
- UI reference image absent.
- Demo audience/output path/redactions not recorded.

Missing UI image is a blocker for final reference-led UI, not necessarily for the early skeletal shell or backend work. Missing RYO/OpenAI live credentials block live runs but not fixture-based deterministic core work. Continue unaffected work where possible after intake.
