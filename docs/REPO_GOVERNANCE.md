# Repository Governance

Last updated: July 11, 2026

This repository uses CODEOWNERS, issue templates, and PR templates in `.github/`.

## Required branch protection checks

Configure GitHub branch protection for `main` to require at least the checks from
the push/PR-gated `CI` workflow:

- `Test` (workflow: CI)
- `Security` (workflow: CI)

The heavier, environment-dependent checks — `Build Check (Expo)` and
`Mobile E2E Smoke (Android)` — live in the separate `Native Checks` workflow and run
**on demand** (`workflow_dispatch`). They are intentionally not required status checks,
since they do not run on every push; trigger them manually before a release.

For release branches/tags, also require the `Build` workflow gates:

- `Quality Gate`
- `Security Gate`

## Required branch protection settings

- Require pull request before merging.
- Require approvals (recommended: at least 1).
- Require review from Code Owners.
- Dismiss stale approvals when new commits are pushed.
- Require conversation resolution before merging.
- Restrict force pushes and direct pushes to protected branches.

## Ownership model

Ownership rules are defined in:

- `.github/CODEOWNERS`

The default owner and all safety-critical path owners resolve to the repository
maintainer (`@lindseystead`).
