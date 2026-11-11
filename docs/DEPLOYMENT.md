# Deployment

## Target topology

- Vercel: React/Vite frontend.
- Render: Fastify API plus worker loop.
- Supabase: PostgreSQL and Auth.

## Preview deployment

1. Use separate preview Supabase project or isolated schema/keys approved by operator.
2. Use preview-only DB credentials, RYO sandbox credentials if available, and OpenAI budget-limited key.
3. Keep fixture-only demo available even when live credentials are absent.
4. Protect preview if it exposes user authentication or non-public analysis data.
5. Record exact frontend/API URLs, deployed commit SHAs, environment, and test evidence in `AI_HANDOFF.md`.
6. Update preview at verified checkpoints.

## Production release

Production is not authorized by default. Before release:
- Obtain explicit release scope and approval recorded in `OPERATOR_INTAKE.md`.
- Verify auth origins, CORS, RLS, secrets, rate limits and provider budgets.
- Confirm DB backup and migration/rollback plan.
- Run full test and security pass.
- Deploy and smoke-test only the authorized services/domains.

If production release is not authorized, deliver the verified preview and exact release instructions. Never infer authority from API keys or repository write access.
