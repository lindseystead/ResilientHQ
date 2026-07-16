# Production Deployment Guide

Last updated: July 10, 2026

This guide reflects the current repository state. It separates what is implemented in code today from what must still be provided by infrastructure or release operations.

**Toolchain:** Node.js 20+ is required (Expo SDK 54 / Metro). The repo pins this via [`.nvmrc`](./.nvmrc) and `engines` in `package.json`; run `nvm use` before building.

Related references:

- [`README.md`](./README.md)
- [`docs/README.md`](./docs/README.md)
- [`docs/AI_PROXY_CONTRACT.md`](./docs/AI_PROXY_CONTRACT.md)
- [`docs/OFFLINE_SYNC_CONTRACT.md`](./docs/OFFLINE_SYNC_CONTRACT.md)
- [`docs/SAFETY_GUARDRAILS_2026.md`](./docs/SAFETY_GUARDRAILS_2026.md)

## Release gates

Before any production build, the repository should pass:

```bash
npm run verify
```

Security and release checks expected in CI:

```bash
npm audit --omit=dev --audit-level=critical
# plus secret scanning, dependency review, Android smoke E2E, and coverage-ratchet checks in GitHub Actions
```

## Environment model

The app has two runtime layers:

1. **Client runtime**
   - Expo / React Native app
   - uses Firebase public configuration
   - calls your first-party API via `EXPO_PUBLIC_API_URL`

2. **Server runtime**
   - AI proxy under `server/ai-proxy/`
   - holds the provider credential
   - performs request normalization, locale-aware input/output safety checks, rate limiting, and auth enforcement

## Required client environment variables

Populate `.env` or your EAS secrets with:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_API_URL=
```

`EXPO_PUBLIC_API_URL` must point at your deployed backend base URL, not directly at OpenAI.

## Required server environment variables

For the AI proxy:

```bash
OPENAI_API_KEY=
AI_PROXY_REQUIRE_AUTH=true
AI_PROXY_VERIFY_FIREBASE_TOKENS=true
AI_PROXY_PORT=8787
AI_PROXY_ALLOWED_MODELS=gpt-4o-mini,gpt-4.1-mini
AI_PROXY_TIMEOUT_MS=30000
AI_PROXY_ALLOWED_ORIGINS=https://app.example.com,https://staging.example.com
# Required in production by default: path to a shared rate-limit backend adapter
# that YOU provide (implements the interface in docs/AI_PROXY_CONTRACT.md); the
# repo does not ship one.
AI_PROXY_RATE_LIMIT_STORE_PATH=./server/ai-proxy/rateLimitStore.js
# Emergency-only overrides (leave false in normal operation)
AI_PROXY_ALLOW_INSECURE_AUTH_IN_PRODUCTION=false
AI_PROXY_ALLOW_MEMORY_RATE_LIMIT_IN_PRODUCTION=false
AI_PROXY_ENABLE_SEMANTIC_MODERATION=true
AI_PROXY_OUTPUT_MODERATION_MODEL=omni-moderation-latest
AI_PROXY_SEMANTIC_MODERATION_FAIL_CLOSED=true
AI_PROXY_SEMANTIC_MODERATION_MIN_CHARS=240
AI_PROXY_MAX_MESSAGES=60
AI_PROXY_MAX_MESSAGE_CHARS=4000
AI_PROXY_MAX_SYSTEM_MESSAGE_CHARS=8000
```

### Important

If `AI_PROXY_VERIFY_FIREBASE_TOKENS=true`, the deployed server runtime must also have:

- `firebase-admin` installed
- valid Google credentials available to the runtime

The proxy now fails closed when verification is required but not configured. That is intentional.

## AI proxy deployment checklist

### Minimum acceptable production configuration

- `OPENAI_API_KEY` present in the server runtime
- `AI_PROXY_REQUIRE_AUTH=true`
- `AI_PROXY_VERIFY_FIREBASE_TOKENS=true`
- `AI_PROXY_RATE_LIMIT_STORE_PATH` configured (unless emergency override is explicitly enabled)
- `AI_PROXY_ENABLE_SEMANTIC_MODERATION=true`
- `AI_PROXY_SEMANTIC_MODERATION_MIN_CHARS` tuned for your traffic/latency envelope
- `AI_PROXY_MAX_MESSAGES`, `AI_PROXY_MAX_MESSAGE_CHARS`, and `AI_PROXY_MAX_SYSTEM_MESSAGE_CHARS` set to values aligned with your abuse and cost envelope
- `firebase-admin` installed in the server runtime
- valid service account or application default credentials available
- HTTPS terminated before the proxy
- `/health` wired into your deployment health checks
- request logging configured without storing raw sensitive user content
- `AI_PROXY_ALLOWED_ORIGINS` set to trusted web origins (no wildcard in prod)

### Recommended production hardening

- deploy behind a managed load balancer or edge gateway
- keep `AI_PROXY_ALLOW_INSECURE_AUTH_IN_PRODUCTION=false` and `AI_PROXY_ALLOW_MEMORY_RATE_LIMIT_IN_PRODUCTION=false`
- add IP-level and user-level rate limits upstream if available
- add structured logs for:
  - route
  - model
  - safety result
  - verified user uid
  - provider latency
- set up alerting for:
  - proxy 5xx spikes
  - provider timeout spikes
  - repeated auth verification failures

## Mobile build checklist

### Code and configuration

- version and build numbers updated
- production API URL set
- Sentry DSN configured if used in production
- privacy policy and terms URLs ready
- app icons and launch assets verified

### Device QA

Run targeted checks on:

- small iPhone / Android phone
- large phone
- tablet
- dark mode
- offline / flaky network conditions
- private chat session flow
- crisis-support path
- export and delete flows

Run mobile smoke E2E for auth navigation:

```bash
npm run e2e:maestro:smoke
```

### Core manual flows to verify

- auth: sign in, sign up, reset password
- home: daily check-in, insights, weekly plan completion
- mood: log and history
- journal: save, private draft-disabled flow, edit
- chatbot: normal chat, private session, crisis escalation, summary generation
- settings: export data, export chat history, clear chat history
- settings: offline queue clear + force sync outcome states (offline/deferred/partial/success)
- reliability: create mood/journal/post/comment writes offline, reconnect, and confirm replay via force sync

## Local smoke test before shipping

In one terminal:

```bash
OPENAI_API_KEY=your_key_here AI_PROXY_REQUIRE_AUTH=false npm run server:ai-proxy
```

In another terminal:

```bash
npm start
```

For a production-like local test, enable auth verification only if the runtime has `firebase-admin` available and configured:

```bash
AI_PROXY_REQUIRE_AUTH=true AI_PROXY_VERIFY_FIREBASE_TOKENS=true npm run server:ai-proxy
```

## EAS release flow

### iOS

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

### Android

```bash
eas build --platform android --profile production
eas submit --platform android
```

## What this repo does not do for you

These are still external release responsibilities:

- provisioning Apple / Google store metadata
- configuring Firebase production resources and security rules
- installing `firebase-admin` in your server runtime
- deploying the AI proxy to a stable HTTPS environment
- monitoring production logs, crashes, and incidents

## Production sign-off

Do not ship until these are all true:

- repository validation commands pass
- deployed proxy is reachable from the mobile app
- proxy auth is verified, not header-only
- provider requests succeed in the deployed environment
- manual device QA is complete
