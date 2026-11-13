# AI_HANDOFF.md — Dissent

**Last blueprint revision:** 2026-11-13  
**Project status:** Product/architecture blueprint prepared; application implementation has not started in this handoff.  
**Current phase:** Phase 0 — operator intake/readiness.  
**Repository state:** Not inspected in this planning conversation.  
**Preview URL:** Not deployed.  
**Deployed commit:** None.  
**Production/mainnet authority:** Not granted by this document.  
**Budget ceiling:** Not supplied; no paid action is authorized by default.

## Source-of-truth package
- `PROJECT_SPEC.md`
- `ARCHITECTURE.md`
- `IMPLEMENTATION_PLAN.md`
- `AGENTS.md`
- `DISSENT_ATTACKER_OUTPUT_SCHEMA.md`
- `docs/ADJUDICATION_SPEC.md`
- `docs/SECURITY_SPEC.md`
- `docs/SMART_CONTRACT_SPEC.md`
- `docs/API_SPEC.md`
- `docs/DATA_MODEL.md`
- `OPERATOR_INTAKE.md`
- `REFERENCE_ASSETS.md`
- `DEMO_VIDEO_PLAN.md`

## Frozen architecture summary
Modular monolith: Next.js + TypeScript API/UI, PostgreSQL + Drizzle, pg-boss worker, OpenAI + Anthropic + NEAR AI Cloud TEE provider adapters, Rust NEAR contract, Vitest and Playwright, Docker and Railway default deployment.

Eight isolated attackers, visible committed conditions, required outside-condition search, Evidence Auditor, Sycophancy Auditor, reproducibility review, deterministic no-majority adjudication, certificate hash anchored on NEAR.

## Important verified corrections
1. Pyth documentation says Pyth Core no longer supports NEAR as of 2026-08-26. Do not make it a mandatory data feed.
2. NEAR AI Cloud has attested open-weight inference; verify deployment and each response signature using its verification tooling.
3. NEAR Intents 1Click has no testnet. NEP-413 signed intent requires the owner's full-access key. Do not expose it to an execution agent or assume a Function Call Key can sign the intent.
4. Keep all live execution and mainnet bounty transfers outside MVP unless explicitly authorized and secured.

## Intake status
- Product definition and scope: specified.
- UI reference images: **missing from current handoff; required during Phase 0**.
- Repository and Git access: unknown.
- Model credentials/IDs/quotas: unknown.
- NEAR testnet access, deploy authority, client signer, fixed testnet fee and bounty recipients: unknown.
- Pikespeak/NearBlocks credentials: unknown/optional.
- RedStone feed and adapter availability: requires smoke test.
- Preview host and credits: unknown.
- Budget ceiling: unknown.
- Production release/mainnet permission: not granted.
- Demo narration/output destination: unknown.

## Required operator intake action
Complete `OPERATOR_INTAKE.md` in one consolidated readiness check. Do not ask separate follow-up questions for each phase. No code changes before all critical inputs and reference assets are present.

## Checkpoint update template
```text
Current phase:
Completed:
Test evidence:
Preview URL:
Deployed commit:
Reference asset status:
stageshow install/inspection status:
Documentation status:
Demo video status:
Known issues:
Cost consumed / budget ceiling:
Production/mainnet authority:
Next task:
Blocked by:
```
