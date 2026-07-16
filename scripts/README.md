# Scripts

Repository automation scripts are organized by responsibility:

- `scripts/quality/`
  - `check-feature-boundaries.js`: enforces feature import boundaries.
  - `check-design-tokens.js`: blocks non-tokenized styling in feature/shared code.
  - `check-dependencies.js`: blocks newly-unused dependencies against baseline.
  - `dependency-check-baseline.json`: baseline for dependency hygiene checks.
  - `check-unused-files.js`: blocks newly-unreachable source files against baseline.
  - `unused-files-baseline.json`: baseline for unused file checks.
  - `check-coverage-ratchet.js`: prevents coverage regression below baseline.
  - `coverage-baseline.json`: ratchet floor used by coverage checks.
- `scripts/e2e/`
  - `run-maestro-smoke.sh`: executes the mobile smoke flow with Maestro.

Use the npm scripts in `package.json` as the public entrypoints.
