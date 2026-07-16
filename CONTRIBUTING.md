# Contributing to ResilientHQ

This repository is open source under MIT and expects changes to be small in scope, verifiable, and consistent with the existing architectural boundaries.

## Working agreement

- Prefer incremental refactors over broad rewrites.
- Preserve feature boundaries. Do not introduce new cross-feature imports.
- Keep UI changes inside the shared design system when possible instead of styling each screen independently.
- Treat the AI proxy as the only valid path for provider calls. Do not add direct client-side model access.

## Branching

Use focused branch names:

```bash
git checkout -b feat/resilience-plan-progress
git checkout -b fix/chat-stream-parser
git checkout -b refactor/chat-screen-layout
```

## Local setup

```bash
npm install
cp .env.example .env
```

If you need local AI testing:

```bash
OPENAI_API_KEY=your_key_here npm run server:ai-proxy
```

## Project structure

```text
src/
  domains/      Shared business logic and reusable data access
  features/     Feature-owned screens, components, and hooks
  shared/       Shared UI, hooks, and utilities
  services/     External integrations and platform services
  providers/    App-wide state providers
  navigation/   Route types and navigator composition
  config/       Runtime-safe config and design tokens

server/
  ai-proxy/     First-party AI proxy
```

### Architecture rules

- `features/*` may depend on `domains`, `shared`, `services`, `config`, and `types`.
- `features/*` may import route type contracts from `src/navigation/types` only.
- `features/*` must not import directly from other `features/*`.
- `features/*` must not import navigation runtime internals.
- `shared/*` must not depend on `features/*`.
- `services/*` must stay feature-agnostic.

Validate the rule set with:

```bash
npm run lint:architecture
```

Validate design token usage with:

```bash
npm run lint:design
```

Validate import acyclic boundaries with:

```bash
npm run lint:cycles
```

Validate Firestore rules/index governance with:

```bash
npm run lint:firestore
```

## Implementation standards

### Type safety

- Keep TypeScript strict.
- Prefer explicit interfaces over `any`.
- If a type escape hatch is unavoidable, isolate it at an interop boundary and document why.

### File headers and comments

- Keep module headers concise and accurate when a file already uses top-level headers.
- Avoid decorative comments or stale author/date banners that do not reflect code ownership.
- Prefer comments that explain intent or constraints over comments that restate obvious code.

### UI and layout

- Use shared primitives from `src/shared/ui`.
- Use tokens from `src/config/theme.ts` for spacing, color, radius, and elevation.
- Prefer `ProtectedScreen` and `ScreenLayout` over ad hoc screen scaffolding.
- Default to responsive helpers from `useResponsive()` for spacing and typography.

### State and hooks

- Keep hooks single-purpose and composable.
- Move reusable business logic to `src/domains/*`.
- Keep feature hooks focused on orchestration and UI state, not shared data ownership.

### AI and safety

- Route all AI traffic through the first-party proxy.
- Preserve safety metadata and escalation behavior in both sync and streaming flows.
- Do not log raw sensitive user content unnecessarily.

### Documentation standards

- Update docs in the same PR as implementation changes when behavior, env vars, or contracts change.
- Keep `README.md`, `DEPLOYMENT_GUIDE.md`, and `docs/*` consistent with the current codebase.
- When safety behavior changes, update both `docs/AI_PROXY_CONTRACT.md` and `docs/SAFETY_GUARDRAILS_2026.md`.
- Keep architectural decisions aligned with `docs/ARCHITECTURE.md`.

## Tests and validation

Run the full suite before opening a PR:

```bash
npm run verify
```

Coverage policy:

- global Jest thresholds are baseline-gated and ratcheted upward as coverage improves
- critical resilience/safety utility surfaces use stricter per-path coverage thresholds
- `npm run coverage:ratchet` prevents coverage regressions below `scripts/quality/coverage-baseline.json`
- `npm run deps:check` prevents new unused dependency drift
- `npm run unused:files` prevents new unreachable file drift

For UI changes, include:

- before/after screenshots or short screen recordings
- device coverage notes (small phone, large phone, tablet if relevant)
- any accessibility changes that affect motion, contrast, or focus order

For critical user flows (auth/chat/journal), include an updated device E2E note:

```bash
npm run e2e:maestro:smoke
```

## Pull requests

Each PR should include:

- what changed
- why it changed
- risk areas
- exact validation commands run
- screenshots for user-facing UI changes

Avoid mixed-purpose PRs that combine:

- large formatting churn
- architectural moves
- behavior changes
- visual redesigns

Split them when possible.

## Commit style

Use direct, scoped commit messages:

```text
feat: add adaptive reminder preview card
fix: handle ai proxy stream done events without duplicating content
refactor: extract chat session preferences from chatbot screen
docs: align deployment guide with ai proxy verification flow
```

## Release-sensitive changes

Call these out explicitly in the PR description:

- auth changes
- AI proxy changes
- environment variable changes
- Firebase schema or rule changes
- navigation contract changes

## Questions

If you are not sure where logic belongs, default to this order:

1. `domains/*` for reusable business logic
2. `shared/*` for UI primitives or generic utilities
3. `features/*` only for feature-specific orchestration

When in doubt, optimize for maintainability and explicit boundaries, not cleverness.
