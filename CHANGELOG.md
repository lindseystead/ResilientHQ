# Changelog

All notable changes to ResilientHQ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- React Navigation implementation replacing Expo Router
- Production readiness roadmap documentation
- Environment variable example file
- Comprehensive architecture documentation
- New reusable components: `HighlightsCard`, `SearchBar`, `MoodFilterChips`, `MoodLogHeader`, `MoodLogFooter`
- New custom hooks: `useTodayCounts`, `useJournalEntries`
- Locale/country-aware crisis routing context (`safetyLocale`, `safetyCountry`) across client + AI proxy
- Localized crisis support action mapping for chatbot crisis sheet (`US`, `CA`, `GB`, `IE`, `AU`, `NZ`)
- Documentation index at `docs/README.md` with explicit maintenance rules
- Automated design-token guardrail script (`npm run lint:design`) for raw color literal detection
- Import cycle quality gate (`npm run lint:cycles`) and Firestore governance gate (`npm run lint:firestore`)
- Firestore governance artifacts: `firebase.json` + `firestore.indexes.json`
- AI proxy runtime configuration tests for fail-closed production posture
- Typed offline queue action contract and queue replay router (`queueActions`, `queueProcessor`)
- Offline sync contract documentation (`docs/OFFLINE_SYNC_CONTRACT.md`)

### Changed

- Migrated from Expo Router to React Navigation
- Updated app name from "resilient_portfolio" to "ResilientHQ"
- Refactored all screens to use reusable components and hooks
- Standardized design system with single source of truth for spacing (`theme.spacing`)
- Consolidated documentation files
- Improved component organization and exports
- Hardened AI proxy request normalization and safety context inference from `Accept-Language`
- Updated safety and API contract docs to match current server implementation
- Reorganized README structure (overview, stack, structure, quality gates, docs map)
- Standardized feature/component colors to theme tokens and shared opacity helper (`withAlpha`)
- Hardened client streaming parser to safely handle SSE events fragmented across transport chunks
- Enforced architecture policy that feature code cannot import `src/services/api/openai` directly
- Enforced architecture policy that feature code cannot import navigation runtime internals
- Moved shared tab bar layout primitive to `src/config/layout.ts` to remove feature-navigation coupling
- Hardened AI proxy production defaults to fail closed for auth verification and shared rate limiting
- Added AI proxy message-shape hard limits (`AI_PROXY_MAX_MESSAGES`, per-role content caps) and temperature clamping
- Added baseline API security headers and conditional HSTS for secure proxy requests
- Hardened local sensitive data handling by routing sensitive preferences and queue payloads through secure storage abstraction
- Hardened offline queue replay with explicit `processQueue` summary results and defer-aware semantics
- Added offline queue fallback for mood, journal, post, and comment creation flows on retryable failures
- Replaced community feed AI summary calls with deterministic on-device summary generation
- Hardened chat streaming lifecycle with explicit abort/cancel wiring to prevent stale stream callback races
- Removed external placeholder-avatar dependencies to avoid unnecessary third-party image requests
- Replaced direct third-party affirmation API call with curated local resilience affirmations
- Updated `postinstall` to skip CocoaPods on non-macOS environments

### Removed

- Expo Router dependency
- File-based routing system
- Redundant documentation files (consolidated and cleaned up)

## [1.0.0] — Initial baseline

Version `1.0.0` is the initial engineering baseline captured in `package.json`. The app is a
source project and has **not** been released to the App Store or Google Play; the items under
[Unreleased] above are ongoing work on top of this baseline.

### Added

- Initial baseline
- Mood tracking
- Journaling
- Community feed
- AI chatbot
- Self-care features
- Offline support
- Biometric security
