# Data Model

The canonical entity definitions and field-level constraints are in `PROJECT_SPEC.md` Section 7.

## Core entities

- `profiles`: Supabase Auth user profile and role.
- `analysis_runs`: owner, asset, status, verdict, coverage and rule versions.
- `analysis_jobs`: durable queue job, retry count and worker lease.
- `market_snapshots`: immutable RYO responses, timestamps and canonical hashes.
- `data_gate_reports`: deterministic PASS/WARN/BLOCK report.
- `thesis_packages`: structured thesis and model provenance.
- `kill_criteria`: sealed per-thesis conditions.
- `criteria_commitments`: criteria hash and commit timestamp.
- `attacker_executions`: per-surface run state, inputs/output hashes and usage.
- `attack_findings`: validated BREAK/NO_BREAK/INCONCLUSIVE results.
- `decision_certificates`: immutable, versioned certificate records.
- `audit_events`: append-only event history.
- `idempotency_records`: request deduplication.
- `certificate_verifications`: read-only integrity/replay outcomes.

## Relationship overview

```text
profiles 1:N analysis_runs
analysis_runs 1:N market_snapshots
analysis_runs 1:1 data_gate_reports
analysis_runs 1:1 thesis_packages
thesis_packages 1:N kill_criteria
thesis_packages 1:1 criteria_commitments
analysis_runs 1:N attacker_executions
attacker_executions 1:0..1 attack_findings
analysis_runs 1:0..N decision_certificates
analysis_runs 1:N audit_events
decision_certificates 1:N certificate_verifications
```

## Data protection

User-owned evidence, theses, criteria, findings and certificates are private by default. RYO/OpenAI keys, DB credentials and auth tokens are never stored in domain rows or surfaced in UI. Public visitors see only deterministic synthetic demo fixtures.
