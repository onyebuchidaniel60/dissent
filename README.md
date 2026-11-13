# Dissent

**Adversarial Audit Protocol for AI Trading Agents**

Dissent challenges AI-generated trading decisions before execution. A client submits a thesis and failure conditions, commits their hashes on NEAR, and receives independent attacks from eight specialist agents. Dissent verifies evidence, audits the attackers for weak evidence and sycophancy, adjudicates without majority voting, and issues a certificate that preserves material disagreement.

## Product boundaries
Dissent is an audit and verification layer, not an exchange, custodian, investment adviser or profit guarantee. The hackathon MVP does not execute live trades or move mainnet funds. Failure, missing coverage and unresolved critical evidence result in `ABSTAIN`, not an assumed pass.

## Quick project map
- `PROJECT_SPEC.md` — canonical product definition, MVP, roles, flows, functional requirements and business rules.
- `DISSENT_PRD.md` — identical PRD-named copy included for handoff convenience; keep it synchronized with `PROJECT_SPEC.md` or treat `PROJECT_SPEC.md` as canonical.
- `ARCHITECTURE.md` — stack, modules, data and AI architecture, deployment and security boundaries.
- `IMPLEMENTATION_PLAN.md` — autonomous phase sequence.
- `AGENTS.md` — persistent coding-agent rules.
- `AI_HANDOFF.md` — current project state and next action.
- `OPERATOR_INTAKE.md` — one consolidated readiness and authorization check.
- `REFERENCE_ASSETS.md` — actual UI reference files; currently pending operator supply.
- `DISSENT_ATTACKER_OUTPUT_SCHEMA.md` — common attacker contract (document revision 1.1; payload schema version 1.0).
- `schemas/attacker-output-v1.schema.json` — normative Draft 2020-12 JSON Schema.
- `docs/ADJUDICATION_SPEC.md` — exact verdict and bounty policy.
- `docs/SMART_CONTRACT_SPEC.md` — NEAR contract interfaces/invariants.
- `docs/SECURITY_SPEC.md` — threat model and safeguards.
- `docs/API_SPEC.md` — REST API.
- `docs/DATA_MODEL.md` — schema and data classifications.

## Setup status
This is a planning handoff, not an implemented application. Follow `docs/SETUP.md` after the coding agent completes Phase 0 and initializes the repository. No application code, deployed preview, contract deployment or live service credentials are included.

## Hackathon delivery
The project must be in a public repository, with a public demo post tagging `@NEARProtocol` and `#NEARHackathon`, before the official deadline: 14 November 2026, 23:59 UTC. Do not claim features that are not implemented and tested. The demo video must be no longer than three minutes.

## Security
Never commit `.env`, API keys, wallet keys or seed phrases. Never place client thesis preimages or portfolio evidence on-chain. Never expose a Function Call or Full Access key to an attacker. The MVP must not trade live funds.

## License
Choose and add a project license only after the operator confirms ownership and public-release intent.
