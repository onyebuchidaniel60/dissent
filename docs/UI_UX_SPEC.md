# Dissent — UI/UX Architecture Specification

**Purpose:** Screen and interaction contract for the MVP. This is not a mockup. The actual UI is implemented directly from operator-supplied reference images after the functional E2E gate.

## 1. Product information architecture

Primary navigation:
- Overview
- Audits
- Certificates
- API access / Developer docs
- Settings (workspace owner only)

Operator-only navigation:
- System health
- Provider/model assignments
- Source adapters
- Audit operations
- Policy/version information

Public route:
- Certificate verification by certificate ID/hash.

## 2. Route inventory

| Route | Role | Purpose | Main actions | Data source |
|---|---|---|---|---|
| `/` | Public/client | Product landing and sign-in | Connect/sign in; view docs | Static config |
| `/app` | Client | Overview of owned audits and recent status | Start audit; open audit | Audit API |
| `/app/audits/new` | Client | Submit thesis and conditions | Validate; prepare; commit; fund | Prepare API + wallet |
| `/app/audits/[id]` | Client | Timeline and progress | Refresh status; view stages | Audit API |
| `/app/audits/[id]/results` | Client | Final result and coverage | Expand evidence; inspect dissent; download JSON | Results API |
| `/app/certificates/[id]` | Client | Certificate details | Download; verify on chain | Certificate API/RPC |
| `/verify/[id]` | Public | Redacted certificate/hash verification | Re-check chain record | Public verify API |
| `/docs` | Public | API/product docs | Navigate to verified local/external docs | Docs content |
| `/app/settings/api-keys` | Workspace owner | Create/revoke API credentials | Create once; revoke; rotate | Auth API |
| `/operator` | Dissent operator | Operational overview | Inspect health/audits | Operator API |
| `/operator/audits/[id]` | Dissent operator | Redacted run inspection/recovery | Retry eligible run with reason | Operator API |
| `/operator/providers` | Dissent owner | Model/provider config | Inspect and validate configuration | Operator API/secret manager metadata |

## 3. Screen requirements

### Overview
- Show audit count by status, most recent audits, current provider/TEE system health in redacted form.
- Clear primary CTA “New audit”.
- Empty state explains first audit journey.
- No mock performance or fabricated economic metrics; seeded data carries a DEMO label.

### New audit
- Multi-section form: trading proposal, evaluation horizon, failure conditions.
- Each condition requires ID, description, metric/expression, comparator, threshold, unit, evaluation window and severity.
- Inline validation; duplicate IDs and incompatible units rejected before prepare.
- Preview canonical summary and hashes before wallet commit.
- Explain commitment is immutable and a new audit is required to change conditions.
- Wallet connection/signature failure leaves audit in `AWAITING_COMMITMENT`; no dispatch.
- After verified commitment, show fixed testnet funding quote and expected fee/bounty allocation. No real-money wording.
- The client signs `commit_audit` and `fund_audit` with the connected wallet; show each transaction hash, then “Audit Queued” and poll status.
- On a completed `TRADE` audit, show “Execute Trade”. The client wallet signs the quote deposit; Dissent never uses its vault or holds client funds.
- Copy: “Dissent audits the thesis. You execute the trade with your own funds via 1Click.” On the Testnet preview, state that the deposit uses Tidepool staging and 1Click is the Mainnet path.

### Audit detail/progress
- Timeline states are explicit: validating, commitment, funding, attack, evidence review, sycophancy, reproducibility, adjudication, certificate anchoring.
- Eight attacker cards show role, provider-family label, run status, start/end times and TEE badge only if verified.
- During attack execution, do not reveal findings to the client until sealed result release.
- Failure/partial states distinguish not run, failed, partial and complete.
- Poll with bounded exponential backoff; pause hidden-tab polling and provide manual refresh.

### Results
- Verdict with plain-language explanation and machine-readable enum.
- Coverage matrix: each condition × A01–A08; show `HIT`, `PARTIAL`, `NOT_HIT`, `INVALID_TEST`, or `UNVERIFIABLE` as a separate assessment-status presentation.
- Display evidence status and source/time; don't present unverified findings as accepted.
- Section A and B tabs/sections; B novelty/review status visible.
- Dissenting findings are never hidden to make result appear unanimous.
- Show deterministic gate results and policy version; do not expose chain-of-thought.
- Label fixture data and synthetic/demo values prominently.

### Certificate and public verification
- Redacted public fields only, certificate hash, on-chain account/transaction, verdict and policy version.
- Recompute hash client-side or server-side from canonical certificate bytes and compare with chain.
- If RPC is unavailable, say “verification unavailable”; never show verified by cache alone without timestamp.

### Operator console
- Show queue depth, provider/adapter health, cost ceilings, model diversity readiness, TEE verification readiness.
- Only OWNER can mutate model assignment/policy/contract config.
- OPERATOR can inspect and retry only explicitly eligible failed runs; cannot change final verdict or force payment.
- No wallet private key display or export.

## 4. Global interaction states

Every async component must support loading, empty, success, error, stale/degraded, unauthorized, forbidden, not-found and retryable states as applicable. Use skeletons for loading; do not block whole page when one optional provider is degraded. Never display a button that has no real handler. Disable actions during mutation and show server-confirmed results only.

## 5. Responsive/accessibility requirements

- Mobile first, keyboard navigable, semantic headings/forms/tables, visible focus, labels and descriptions, error association, sufficient contrast.
- Coverage table must horizontally scroll or transform to accessible compact rows; preserve accessible names for status.
- No color-only status encoding; add text/icon labels.
- Touch targets should be comfortably operable; navigation collapses with accessible menu controls.
- Respect reduced motion; avoid unnecessary animation.
- Test 360px, 768px, 1024px and 1440px viewports.

## 6. Reference-image procedure

Current asset register: `REFERENCE_ASSETS.md`. Two operator-supplied, operator-owned references are received and inspected: `design/dissent-reference1.webp` (2048×1536) and `design/dissent-reference2.webp` (2018×12858). The visual language is adapted to Dissent; ShibaNex branding, copy, mascot and trade dress are not copied. At the start of Phase 7, re-read the references, run `npx skills add benjitaylor/skills --skill stageshow` if not already installed, record exact paths and design observations in `DESIGN_NOTES.md`, and implement the real UI. Do not create mockups or ask for mockup approval.

## 7. UI acceptance criteria

- All listed routes render and role protection works.
- Main audit journey can be completed from the UI with connected testnet wallet.
- Progress state is server-driven, not hard-coded.
- Result coverage matches stored adjudication data.
- Public verification never reveals private fields.
- Desktop/mobile/keyboard tests pass.
- No dead controls, `href="#"`, placeholder external URLs or unlabelled status badges.
- Final visual UI references are documented in `REFERENCE_ASSETS.md`; no reference is fabricated.
