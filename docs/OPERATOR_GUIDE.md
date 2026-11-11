# Operator Guide

This guide describes intended operator responsibilities after implementation.

## Before enabling live analysis

- Confirm RYO developer documentation and credentials are current.
- Confirm the exact RYO tool catalog/response schema and quotas.
- Confirm OpenAI model ID and cost ceilings.
- Verify preview/production secrets are isolated.
- Verify database backups and access roles.
- Keep public demo fixtures synthetic and labelled.

## Reading outcomes

- **TRADE:** The thesis survived the configured attack set. Practice-only; not a live trade instruction or profitability guarantee.
- **REFUSE:** A pre-registered failure criterion was triggered.
- **ABSTAIN:** A valid but previously unmodelled BREAK was found, or at least two valid attackers were inconclusive.
- **BLOCKED:** Data Integrity Gate prevented normal analysis.
- **INCOMPLETE:** The run could not complete validated evaluation/persistence. No verdict.

## Operational rules

- Do not manually edit historical criteria, findings, verdicts or certificate JSON.
- Do not interpret unsupported attackers as NO_BREAK.
- Do not bypass Data Gate or minimum-finding rules.
- For corrections, preserve the original record and create a superseding record through the controlled correction path.
- Monitor run and provider costs; stop before operator-defined ceilings.

## Incident response

If a key leaks, revoke/rotate it, inspect access logs, invalidate affected preview deployment, and record an incident. If certificate integrity fails, mark it not verified and preserve the original artifacts for investigation.
