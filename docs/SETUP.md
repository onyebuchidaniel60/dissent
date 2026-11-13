# Setup Guide

This repository is a planning handoff until Phase 1 initializes the application. Do not expect app source files yet.

## Prerequisites (to be confirmed/pinned during intake)
- Node.js 22 LTS (or a currently supported LTS explicitly pinned in `.nvmrc`).
- pnpm version pinned in `packageManager`.
- Rust toolchain pinned via `rust-toolchain.toml` for NEAR contracts.
- PostgreSQL 16+ for local development and pg-boss.
- Docker, Playwright browser dependencies, NEAR Sandbox/near-workspaces.
- Provider credentials only after operator-approved budgets are recorded.

## Initial setup after Phase 0
1. Copy `.env.example` to `.env.local`; never commit the real file.
2. Start local PostgreSQL using the approved compose profile.
3. Install dependencies with the pinned pnpm lockfile.
4. Apply Drizzle migrations.
5. Run contract unit tests and local Sandbox tests.
6. Start web and worker processes separately.
7. Seed synthetic data only. Do not import production portfolio data to preview.

Commands are implementation outputs and must be documented in `README.md` after the repository is inspected. The agent must not invent commands that do not exist.
