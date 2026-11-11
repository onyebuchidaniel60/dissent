# Dissent

**An adversarial audit system for autonomous trading decisions.**  
*It doesn't predict. It audits conviction.*

Dissent creates a falsifiable crypto trading thesis, commits its failure conditions before evaluation, challenges the thesis through isolated specialist attackers, and uses deterministic rules to produce `TRADE`, `REFUSE`, or `ABSTAIN` plus an evidence-linked Decision Certificate.

`TRADE` is a practice-trade research outcome only. This product does not connect wallets, execute orders, custody assets, or guarantee performance.

## Current project status

This repository package is currently a **pre-implementation blueprint**. Application source code, deployments, credentials, and UI reference images have not yet been supplied or created. Read the handoff package before implementation.

## Start here

1. `PROJECT_SPEC.md` — canonical product definition, MVP, workflows, requirements, business rules, data model, API, UX and tests.
2. `ARCHITECTURE.md` — fixed stack and technical architecture.
3. `IMPLEMENTATION_PLAN.md` — autonomous phase sequence and acceptance gates.
4. `AGENTS.md` — persistent coding-agent instructions.
5. `AI_HANDOFF.md` — current project state and exact first task.
6. `OPERATOR_INTAKE.md` — single consolidated initial readiness check.
7. `REFERENCE_ASSETS.md` — UI image inventory and provenance.
8. `DEMO_VIDEO_PLAN.md` — final <=180-second demo specification.
9. `BLUEPRINT_INDEX.md` — package index and current blockers.
10. `references/PROPER_VIBE_CODING_WORKFLOW_AUTONOMOUS.md` — supplied workflow, bundled verbatim.

## Product mechanism

```text
RYO read-only evidence
  → deterministic Data Integrity Gate
  → Thesis Agent
  → pre-registered criteria committed/sealed
  → isolated specialist attackers
  → evidence/schema validation
  → deterministic adjudicator
  → immutable, hash-verifiable Decision Certificate
```

Six attacker domains are defined: Liquidity & Exit, Asset & Contract Safety, Internal Logic & Evidence, Market Regime & Sentiment, Derivatives & Leverage, and Catalyst & Event Risk. The Data Integrity Gate is a separate deterministic preflight layer, not an attacker. At least three valid attacker findings are required for a verdict. An unsupported domain is disclosed, never silently treated as `NO_BREAK`.

## RYO integration baseline

The current official RYO-CHAN hackathon catalog lists:

- `market_overview`
- `scan_market`
- `analyze_token`
- `deep_analysis`
- `compare_tokens`
- `check_safety`
- `supported_tokens`

The architecture selects the official REST interface. Actual base URL, authentication, request parameters, response schemas and rate limits must be verified from current organizer documentation and credentials during operator intake. The previously assumed `monitor_market_sentiment_shift` tool is not part of the current published seven-tool list and is not assumed available.

## Selected stack

- Frontend: React + Vite + TypeScript, React Router, TanStack Query, Tailwind CSS, shadcn/ui.
- API/worker: Fastify + TypeScript + Zod.
- Database/auth: Supabase Postgres + Supabase Auth.
- ORM: Drizzle.
- Durable queue: PostgreSQL `analysis_jobs` table with row locking and worker leases.
- AI: OpenAI Responses API with structured outputs; LLM never adjudicates.
- Hosting: Vercel frontend, Render API/worker, Supabase database/auth.
- Tests: Vitest, Fastify.inject, Playwright.

## Implementation sequence

**Complete operator intake → early skeletal frontend deployment → core functionality → end-to-end verification → reference-image-led UI implementation → frontend/docs/footer completeness → demo video → final regression and authorized release.**

The coding agent must ask for missing critical inputs once during Phase 0. It then executes all phases continuously with test/inspect/fix/commit/handoff checkpoints. Production release, paid upgrades, destructive changes and other irreversible actions remain outside authority unless explicitly granted.

## Documentation

See `docs/` for setup, configuration, testing, deployment, troubleshooting, design notes, operator guide, API, data model, RYO integration notes, and build log. The documents are implementation targets until actual code and infrastructure exist.

## Official references

- [RYO-CHAN Hackathon](https://ryobuild.com/)
- [RYO-CHAN Developer / Hackathon information](https://dev.ryobuild.com/)

These public pages establish the published tool catalog and transport options, but not necessarily the exact project credential, endpoint details or response schema. Use organizer-provided developer documentation for those contracts.
