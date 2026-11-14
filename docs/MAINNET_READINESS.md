# Mainnet readiness audit

**Status:** code-ready, not deployed. No mainnet contract, mainnet transaction or real-fund transfer is authorized by this repository.

## Configuration

- Defaults are centralized in `src/lib/config.ts`: `mainnet`, `ONECLICK`, execution disabled. `NEAR_NETWORK` and `NEXT_PUBLIC_NEAR_NETWORK` are mainnet.
- Mainnet RPC and explorer are the defaults. Registry, vault, payout, deployer and agent accounts have no testnet fallback; missing values fail closed.
- `EXECUTION_ENABLED=false` and `PROPRIETARY_LOOP_ENABLED=false` by default.
- `/readyz` validates database health plus runtime network/venue/account configuration.
- The preview environment is an explicit testnet staging deployment; the customer-facing UI is network-neutral and does not display a testnet label.

## Execution adapter

- Primary: 1Click mainnet, base URL `https://1click.chaindefuser.com`. A read-only precheck returned 231 tokens and a dry `0.01 wNEAR → 0.034224 USDC` quote; no deposit address, transaction or real funds were involved.
- Origin: `nep141:wrap.near`; destination: the live mainnet USDC asset ID from `/v0/tokens` (`nep141:17208628…`), not `usdc.near`.
- The adapter requests a live `ORIGIN_CHAIN` quote and calls `vault.spend_ft_as` only after the owner approves the certificate and quote deposit address.
- Tidepool remains available only with `EXECUTION_VENUE=TIDEPOOL` for staging.
- `PROPRIETARY_EXECUTION_AUDIT_ID` scopes execution to one audit. A client `TRADE` certificate cannot spend the vault.

## Contract findings and fixes

| Finding | Impact | Fix |
|---|---|---|
| `#[init(ignore_state)]` on the staging upgrade | Arbitrary reinitialization of a deployed vault | Mainnet source uses `#[init]`; upgrades require a new audited contract or reviewed migration |
| Certificate replay | Same approved certificate spent multiple times | `used_certificates` rejects a second spend |
| Permanent quote allowlist | A per-quote deposit address stayed approved forever | `set_recipient_until` binds the address to a quote window |
| Cap unit ambiguity | Caps are yoctoNEAR-equivalent; a 6-decimal token would be mispriced | `ft_token_decimals == 24` is required at initialization |
| Single owner key | Owner key compromise could change caps/withdraw | Mainnet owner must be a multisig/timelock; documented as a deployment gate |
| Registry bounty path | Testnet fee/bounty logic is not a mainnet custody design | Mainnet release requires independent review of the registry fee/bounty path |

Source wasm: `contracts/dissent-vault/target/wasm32-unknown-unknown/release/dissent_vault.wasm`; SHA-256 `f8475b3998114e9970e51a6473c6acccdb14517986267f4ef058df747f43f582`; `cargo test` 12/12.

## Remaining operator actions

1. Create operator-owned mainnet registry, vault, payout and agent accounts.
2. Deploy a fresh `#[init]` vault with a multisig/timelock owner, wNEAR storage and conservative caps.
3. Add a Function Call Key for the execution agent scoped only to `spend_as` and `spend_ft_as`.
4. Configure 1Click, a mainnet recipient/refund account and a fresh mainnet database.
5. Complete independent security review of the registry fee/bounty path and the 1Click integration.
6. Record explicit production/mainnet authorization in the operator intake before enabling execution or moving real funds.

## Verification

- Vault: 12/12 Rust tests.
- Execution package: 13/13 Vitest tests.
- Application: 13/13 Vitest tests; `typecheck`, `lint` and `build` pass.
- Playwright: 3/3 at 390×844 and 1440×900, including the network-neutral operator execution receipt.
- No new spend; no mainnet deployment or real-fund transaction.
