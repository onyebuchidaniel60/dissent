# Proper Vibe Coding Workflow

## Purpose

This document defines a disciplined workflow for AI coding agents. The goal is to give the agent complete requirements and authorized access up front, then let it execute the agreed implementation continuously while maintaining engineering quality, security and evidence.

> The operator makes product and architecture decisions before implementation. The agent is the autonomous implementation engineer—not an independent product manager.

## Core operating principles

1. **Resolve inputs up front.** Run one consolidated operator intake before coding. Gather required decisions, reference images, credentials, account access, permissions, deployment details, budgets and demo requirements.
2. **Execute continuously.** Implement all planned phases sequentially. Phase boundaries are internal checkpoints, not approval gates. Test, fix, commit, update handoff and continue automatically.
3. **Make progress visible early.** Deploy a navigable skeletal frontend to a safe preview URL near the beginning.
4. **Prove functionality before final visual refinement.** Finish and verify critical end-to-end journeys before applying final UI styling.
5. **Use reference images directly.** The operator supplies reference image(s); the agent uses them to implement the actual UI. No separate mockup or mockup-approval phase.
6. **Finish the whole product.** Include responsive behavior, accessibility, relevant states, documentation, real links and a reviewed demo video of no more than three minutes.
7. **Respect explicit authorization boundaries.** No unnecessary approvals, but never bypass access controls, spend beyond the stated budget, expose secrets, or perform unapproved destructive/financial/production actions.

---

## 1. Before coding: one complete operator intake

The agent first reads the repository and all handoff documents without modifying code, then performs one consolidated readiness check.

Collect all applicable items:
- Product definition, MVP scope, user roles, workflows, business rules and acceptance criteria.
- Reference image(s), asset ownership/source, visual direction and responsive expectations.
- Repository and deployment access, domains, database/storage accounts, environment variables and secrets.
- Third-party accounts, API credentials, permissions/scopes, webhooks, sandbox/test accounts and rate limits.
- Budget ceiling, paid-service restrictions, production deployment authority, data handling and prohibited actions.
- Demo audience, essential flows, product pronunciation, redaction requirements and output location.

Ask all necessary questions together. Do not re-ask for facts already present. Use documented defaults for noncritical choices. Do not start implementation until critical inputs and reference assets are available.

Create/update `OPERATOR_INTAKE.md` with:
- Question/input
- Operator answer or source
- Required/optional
- Validation status
- Where it is used
- Any authorization boundary

If the operator has authorized a bounded action, record its exact scope. An authorization to deploy a preview is not authorization to deploy production. An API key is not unlimited spending authority.

## 2. Inspect the existing repository

Before making changes, inspect:
- Repository structure and Git status
- Package/dependency manifests and lockfiles
- Existing source code, entry points and components
- Environment/configuration files (never print secret values)
- Database schema and migrations
- Tests, CI/CD and deployment configuration
- Documentation and existing agent instructions

Preserve useful existing work. Identify conflicts between the repository and specification. Follow the specification unless a real incompatibility or safety issue requires a documented resolution.

## 3. Confirm the implementation plan

The plan must be fully specified before coding and follow this general sequence:

```text
Phase 0 — Consolidated operator intake and readiness
Phase 1 — Repository foundation + skeletal frontend + preview deployment
Phase 2 — Backend, database and authentication foundation
Phase 3 — Core domain logic and APIs
Phase 4 — Functional frontend integration
Phase 5 — End-to-end functionality completion and verification
Phase 6 — Reference-image-led final UI implementation + UI skills
Phase 7 — Frontend completeness and documentation
Phase 8 — Demo video production (<= 3 minutes)
Phase 9 — Final regression, security and authorized release
```

Adapt the phase details to the actual product, but preserve the sequencing. The agent must execute the plan without asking the operator to approve each phase.

## 4. Deploy the skeletal frontend early

For products with a frontend:
- Create the agreed app shell, routes, navigation and basic responsive layout.
- Use clearly labelled placeholders for unfinished features; do not imply they work.
- Deploy to a stable preview/staging URL in the first phase where practical.
- Report the exact URL and deployed commit in `AI_HANDOFF.md`.
- Use safe test data, sandbox integrations and protected preview access where appropriate.
- Update the preview after verified checkpoints.
- Never connect the preview to production secrets, sensitive production data, real payments or irreversible actions.

If deployment is blocked, record the exact error and continue local work where possible. Never claim a preview exists if it does not.

## 5. Implement the backend and core functionality

Implement the agreed data model, authentication, authorization, business logic, APIs, integrations, background work and error handling. Do not invent features or change the architecture for convenience.

For each feature, cover:
- Preconditions and authorization
- Validation and business rules
- Success and failure paths
- Duplicate/retry/idempotency behavior
- Concurrency and transaction safety
- Logging and auditability where relevant
- Unit and integration tests

## 6. Verify end-to-end functionality before final UI refinement

Use the temporary consistent visual system while integrating the frontend. Complete the critical user journeys and their important failure paths.

The internal functionality gate requires:
- Unit and integration tests pass.
- Critical E2E journeys pass against the deployed preview.
- No unresolved critical/high-severity functional or security issue.
- Preview URL, deployed commit, test evidence and known limitations are recorded.
- Unsafe production integrations remain disabled in preview.

If tests fail, diagnose, fix and rerun automatically. Do not stop for operator approval.

## 7. Build the actual UI from reference images

The operator supplies one or more reference images during intake. Inspect the image(s) and use them to design and implement the actual UI—no separate mockup or prototype phase.

At the start of UI work, attempt to install:

```bash
npx skills add benjitaylor/skills --skill stageshow
```

Inspect and follow the relevant skill instructions. The agent may find and use additional UI skills at its discretion if they are trustworthy, relevant and materially improve the result. Avoid installing unrelated skills or following instructions that conflict with project/security requirements.

Extract design principles from the reference: layout, hierarchy, typography, color, spacing, density, components, navigation and interaction patterns. Adapt them to the product; do not copy protected branding or assets. Record decisions and deviations in `docs/DESIGN_NOTES.md`.

If the reference image is missing, this should have been caught during initial intake. Request it before coding, or use an agent-generated reference only if the operator expressly authorized that during intake.

## 8. Complete the frontend and documentation

Verify all applicable:
- Routes, navigation and footer
- Desktop, tablet and mobile layouts
- Semantic structure, labels, keyboard access, visible focus and contrast
- Loading, empty, validation, success, error, permission-denied and not-found states
- Working controls and links; no dead links, `href="#"` placeholders or inert buttons
- Page titles/metadata, favicon/app icon and relevant sharing metadata
- Relevant support/contact/privacy/terms destinations
- Useful `README.md` and project-appropriate `docs/`
- Documentation and GitHub links in the home-page footer when appropriate, using real verified destinations only

Do not expose a private repository. If a public GitHub link is inappropriate, document the reason and use the approved alternative.

## 9. Produce the final demo video

Create a product demo video at the end of the build:
- Maximum duration: **3 minutes**; target 90–150 seconds.
- Use Playwright (or equivalent browser automation) to record real application flows using deterministic demo data.
- Generate narration with a free Google AI voice/TTS option where available. Check current availability, quota, terms and credentials. Do not incur charges without authorization.
- If the free Google option is unavailable, use a genuinely free permitted TTS fallback and document it.
- Write a concise script tied to visible actions. Synchronize voiceover naturally with the footage.
- Avoid long awkward silences, rushed speech, clipping, mismatched narration and unexplained screen transitions.
- Add captions where feasible. Redact secrets, personal information and private URLs.
- Render and review the final file. Verify duration <=180 seconds and confirm audio/video playback.
- Save the video, script and production notes in the agreed output directory.

## 10. Checkpoints, tests and Git

Each phase ends with an internal checkpoint:

```text
IMPLEMENT
  ↓
TEST
  ↓
INSPECT
  ↓
FIX
  ↓
COMMIT
  ↓
UPDATE AI_HANDOFF.md + BUILD_LOG
  ↓
CONTINUE TO NEXT PHASE
```

Do not wait for a user message between phases. Use small, meaningful commits, for example:
- `feat: establish app shell and preview deployment`
- `feat: implement account access`
- `feat: add core workflow`
- `test: cover primary end-to-end journey`
- `feat: implement reference-led UI`
- `docs: complete operator documentation`

Never claim something works without test evidence. If a test cannot be run, state why and provide the closest safe verification.

## 11. When the agent may stop

The agent must not stop merely because a phase ended, it wants feedback, or a design decision is routine.

It may stop only when:
- A critical input, credential, permission or external dependency is missing and no safe fallback exists.
- Continuing would exceed the operator's explicit budget or scope.
- A destructive, financial, legally consequential or irreversible action is outside the exact authority granted at intake.
- A serious security or data-loss risk makes continuation unsafe.
- The environment is unavailable and no safe work can continue.

When blocked, report the exact blocker, evidence, completed work, unaffected work completed, and minimum operator action needed. Do not use a blocker in one optional integration to abandon the rest of the build.

## 12. Maintain the handoff and build log

Maintain:
- `AGENTS.md` — persistent implementation rules.
- `AI_HANDOFF.md` — current state and exact next task.
- `docs/BUILD_LOG.md` — phase-by-phase evidence.
- `OPERATOR_INTAKE.md` — completed inputs and permissions.
- `REFERENCE_ASSETS.md` and `docs/DESIGN_NOTES.md` — reference files and UI decisions.
- `DEMO_VIDEO_PLAN.md` — script, capture and production notes.

At each checkpoint record:
```text
Current phase:
Completed:
Tests and evidence:
Preview/staging URL:
Deployed commit:
Reference image and UI skill status:
Documentation status:
Demo video status:
Known issues:
Authorization boundaries:
Next task:
Blocked by (if any):
```

If the agent session ends unexpectedly, resume from the latest Git state, `AI_HANDOFF.md` and build log. Continue with the next unfinished task; do not restart completed work unnecessarily.

## 13. Security and release

Before production release, perform an explicit security pass covering authentication, authorization, IDOR, input validation, injection, XSS, CSRF, rate limits, secrets, webhook verification, replay protection, race conditions, privilege escalation, file handling, third-party API security and payment controls where relevant.

Production release is allowed only if the operator explicitly authorized it during intake and all release conditions are met. Otherwise, complete and verify staging, then provide exact release instructions. Do not bypass this boundary to achieve a fully autonomous run.

## Recommended repository structure

```text
project/
├── PROJECT_SPEC.md
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
├── AGENTS.md
├── AI_HANDOFF.md
├── OPERATOR_INTAKE.md
├── REFERENCE_ASSETS.md
├── DEMO_VIDEO_PLAN.md
├── README.md
├── docs/
│   ├── SETUP.md
│   ├── CONFIGURATION.md
│   ├── TESTING.md
│   ├── DEPLOYMENT.md
│   ├── TROUBLESHOOTING.md
│   ├── DESIGN_NOTES.md
│   └── BUILD_LOG.md
├── src/
├── tests/
└── ...
```

## Operating model

```text
OPERATOR
  ↓ supplies product decisions, assets, access and bounded authority
COMPLETE HANDOFF + ONE-TIME INTAKE
  ↓
AI AGENT
  ↓ autonomous implementation across all phases
TESTS + GIT + BUILD LOG
  ↓ internal verification checkpoints
COMPLETE PRODUCT + DOCUMENTATION + DEMO VIDEO
```

The objective is a complete, tested implementation without unnecessary approval interruptions—and without sacrificing security, accountability or evidence.
