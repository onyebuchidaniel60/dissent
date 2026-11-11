# RYO Integration Notes

**Verification date:** 11 November 2026  
**Sources:** Official RYO-CHAN hackathon pages below.

## Published facts used in the blueprint

The current public hackathon description lists seven research tools:

1. `market_overview`
2. `scan_market`
3. `analyze_token`
4. `deep_analysis`
5. `compare_tokens`
6. `check_safety`
7. `supported_tokens`

It describes the tools as read-only and available over MCP or REST. It also describes live pricing/technical/derivatives/safety research and an honest provenance convention: when a source is rate-limited or unavailable, the response should say so; missing data remains missing.

## Design implications

- The project selects REST as its integration transport.
- Safety attacker A2 should prioritize `check_safety`.
- `supported_tokens` supports token identity/availability validation.
- `deep_analysis` may expose derivatives or additional risks, but the exact returned fields must be inspected before activating A5/A6.
- The currently published seven-tool list does not include `monitor_market_sentiment_shift`; the project does not assume that tool exists.
- Liquidity depth, executable slippage, holder concentration, contract authority, unlock schedules, catalyst events, or funding/open-interest details must not be claimed unless the real tool response contains source-backed fields capable of supporting them.

## What is not established by the public pages

The pages do not establish for this specific operator/account:

- Exact REST base URL and path patterns.
- Exact authentication scheme/header.
- Request parameter and response JSON schemas.
- Required API key scope or registration procedure.
- Per-tool rate limits, quotas, and timeout limits.
- Sandbox/test environment details.
- Whether all seven tools are enabled for the operator's credential.

These are required Phase 0 intake inputs. The coding agent must use current organizer developer documentation and a safe test call. It must not invent missing API contracts.

## Official sources

- https://ryobuild.com/
- https://dev.ryobuild.com/
