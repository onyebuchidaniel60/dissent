# API Reference

The canonical endpoint specifications and schemas are in `PROJECT_SPEC.md` Section 10. All endpoints use `/api/v1` except health checks.

## Public

- `GET /health/live`
- `GET /health/ready`
- `GET /api/v1/attacker-registry` (read-only registry metadata)
- `POST /api/v1/demo/runs` (allowlisted simulated fixtures; rate-limited)

## Authenticated analyst

- `GET /api/v1/me`
- `GET /api/v1/tokens/supported`
- `GET /api/v1/market/overview`
- `POST /api/v1/analyses`
- `GET /api/v1/analyses`
- `GET /api/v1/analyses/:runId`
- `GET /api/v1/analyses/:runId/events` (SSE)
- `POST /api/v1/analyses/:runId/cancel` (pre-criteria-seal only)
- `GET /api/v1/certificates/:certificateId`
- `POST /api/v1/certificates/:certificateId/verify`

## Error shape

```json
{
  "error": {
    "code": "STABLE_ERROR_CODE",
    "message": "Safe user-facing message",
    "request_id": "uuid",
    "details": []
  }
}
```

Do not return raw provider errors, stack traces, secrets, private criteria in generic errors, or cross-user resource existence.

## Authentication

Supabase Auth access JWT is required for analyst routes. Backend verifies issuer/audience/signature/expiry and derives user identity from the token. Every resource query is owner-scoped.
