# External integration source notes

These sources were checked on **13 November 2026** for architecture-sensitive claims. The implementation agent must re-check docs before pinning SDK versions because APIs, models, limits and endpoints can change.

1. **Pyth on NEAR:** Pyth's NEAR page explicitly states Pyth Core no longer supports NEAR as of 26 August 2026 and says the team may be contacted to request a deployment. Do not make Pyth Core a required NEAR price source. https://docs.pyth.network/price-feeds/core/use-real-time-data/pull-integration/near
2. **NEAR Intents 1Click:** official quickstart states no testnet version; signed-intent standard documentation states NEP-413 owner key must be Full Access. No Function Call Key shortcut is assumed. https://docs.agentsonintents.com/integration/distribution-channels/1click-api/quickstart/introduction and https://docs.agentsonintents.com/integration/agent-api/signing-standards
3. **NEAR AI Cloud:** current NEAR AI site describes open-weight models in TEEs and hardware-signed proofs. The inference SDK guide distinguishes `provider_tee` from `gateway`; gateway-only signatures do not prove which model generated the response. https://near.ai/ and https://github.com/nearai/inference-sdk/blob/main/js/docs/verification-guide.md
4. **Rust contracts:** the current docs.rs `near-sdk` page surfaced version 5.30.1 on the research date. Pin a maintained version at build time and run sandbox/contract tests. https://docs.rs/near-sdk/latest/near_sdk/
5. **Hackathon:** official NEAR Hackathon page is the source of submission conditions and deadline; verify final form and post rules again before submission. https://near.org/hackathon (if that canonical URL redirects, follow the official page from the project brief).

Do not infer that a source is usable solely because its documentation exists. The intake/smoke tests must validate credentials, endpoint behavior, supported chain/data fields, freshness, quota and cost.
