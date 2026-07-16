# Documentation Index

Last updated: July 10, 2026

This folder contains implementation-level documentation for the current repository state.

## Core docs

- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
  - Canonical folder layout and module-boundary contract
  - Required quality gates and testing layout
- [`AI_PROXY_CONTRACT.md`](./AI_PROXY_CONTRACT.md)
  - Request/response schema for `/ai/chat` and `/ai/chat/stream`
  - Safety metadata shape, reason codes, auth modes, and runtime env contract
- [`OFFLINE_SYNC_CONTRACT.md`](./OFFLINE_SYNC_CONTRACT.md)
  - Offline queue action names and payload contracts
  - Retry, defer, replay, and force-sync summary semantics
- [`SAFETY_GUARDRAILS_2026.md`](./SAFETY_GUARDRAILS_2026.md)
  - Mapping of implemented AI safety controls to 2026-aligned external guidance
  - Residual gaps that still need product/infrastructure work
- [`REPO_GOVERNANCE.md`](./REPO_GOVERNANCE.md)
  - Branch-protection policy and required checks
  - Ownership and review expectations
- [`RESILIENCE_REFACTOR_PLAN.md`](./RESILIENCE_REFACTOR_PLAN.md)
  - Evidence-based product/architecture roadmap
  - Current known limitations and phased plan

## Root docs

- [`../README.md`](../README.md): project overview, architecture, setup, scripts, and quality gates
- [`../DEPLOYMENT_GUIDE.md`](../DEPLOYMENT_GUIDE.md): production deployment checklist and release sign-off
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md): contribution standards and review expectations
- [`../SECURITY.md`](../SECURITY.md): vulnerability reporting policy
- [`../CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md): community conduct standards
- [`../CHANGELOG.md`](../CHANGELOG.md): notable change history

## Documentation maintenance rules

- Update docs in the same change set as behavior, contract, or environment variable changes.
- Keep examples aligned with current implementation defaults.
- Prefer explicit versioned statements with dates for safety and deployment guidance.
