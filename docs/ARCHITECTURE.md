# Architecture Contract

Last updated: March 9, 2026

This document is the canonical architecture contract for the repository.

## Repository layout

```text
src/
  config/       runtime configuration and app-wide constants
  domains/      cross-feature business logic and contracts
  features/     feature-owned UI, hooks, and feature orchestration
  navigation/   app navigation trees and route types
  providers/    app-level providers
  services/     integration adapters (firebase/observability/offline/security)
  shared/       shared UI primitives/hooks/utils
  types/        shared TypeScript types

server/
  ai-proxy.js   server entrypoint
  ai-proxy/     proxy runtime modules

__tests__/      automated tests only
tests/helpers/  shared test helpers (not test suites)
scripts/quality/ quality gates and policy checks
scripts/e2e/    device/E2E helpers
```

## Import boundaries

Feature modules (`src/features/*`) may import from:

- `src/domains/*`
- `src/shared/*`
- `src/services/*`
- `src/config/*`
- `src/types/*`
- `src/navigation/types` (route type contracts only)
- themselves (`src/features/<same-feature>/*`)

Feature modules must not import from other features directly.
Feature modules must not import navigation runtime internals (for example tab navigators); shared layout values belong in `src/config/*`.

Enforced by:

```bash
npm run lint:architecture
```

## Cross-cutting responsibility rules

- Shared business decisions and scoring logic belong in `src/domains/*`.
- UI primitives and reusable component building blocks belong in `src/shared/ui/*`.
- Side-effectful integrations (network, storage, auth, security adapters) belong in `src/services/*`.
- Feature hooks orchestrate feature behavior but should not own globally shared business rules.
- AI request orchestration belongs in `src/domains/ai/*` (`requestChatCompletion` and `streamChatCompletion`).
- Feature code must not import `src/services/api/openai` directly.
- Firestore moderation counters must be updated only with a same-request report document write.
- Offline write replay is centralized:
  - queue persistence in `src/services/offline/cache.ts`
  - typed action contracts in `src/services/offline/queueActions.ts`
  - queue-to-domain routing in `src/services/offline/queueProcessor.ts`
- Domain write paths that support offline replay must expose `allowOfflineQueue` controls to prevent re-queue loops during replay.
- Community feed summarization is deterministic and local (`src/features/community/hooks/useCommunitySummary.ts`) and should not trigger per-refresh AI calls.

## Testing layout

- `__tests__/integration/*`: feature flow and screen-level integration tests.
- `__tests__/domains/*`: pure business-logic tests.
- `__tests__/services/*`: API/proxy/security adapter tests.
- `__tests__/security/*`: explicit security behavior validation.
- `tests/helpers/*`: reusable test renderers and mocks.

## Required quality gates

```bash
npm run format:check
npm run lint
npm run lint:architecture
npm run lint:cycles
npm run lint:design
npm run lint:firestore
npm run deps:check
npm run unused:files
npm run type-check
npm run test:ci
npm run coverage:ratchet
```

`npm run verify` runs all required gates in order.
