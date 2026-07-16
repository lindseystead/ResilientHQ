# AI Proxy Contract

Last updated: March 9, 2026

The mobile client must call a first-party backend for all AI traffic. Provider credentials remain server-side.

This document matches the current repository implementation under `server/ai-proxy/`.

## Base URL

- Configure `EXPO_PUBLIC_API_URL` in the mobile client.
- The client trims trailing slashes and builds `/ai/chat` and `/ai/chat/stream` relative to that base URL.

## Endpoints

### `GET /health`

Returns a lightweight health payload for local checks and deployment probes:

```json
{
  "ok": true,
  "auth": {
    "required": true,
    "verification": "firebase"
  }
}
```

### `POST /ai/chat`

Request body:

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.7,
  "maxTokens": 800,
  "safetyIdentifier": "hashed_user_identifier",
  "safetyLocale": "en-US",
  "safetyCountry": "US"
}
```

Success response:

```json
{
  "content": "Assistant response text",
  "safety": {
    "level": "clear",
    "blocked": false,
    "shouldEscalate": false,
    "reasonCodes": [],
    "redactedTypes": []
  },
  "metadata": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "responsesApi": false
  }
}
```

Error response:

```json
{
  "content": "",
  "error": "Human-readable error message",
  "safety": {
    "level": "clear",
    "blocked": false,
    "shouldEscalate": false,
    "reasonCodes": [],
    "redactedTypes": []
  }
}
```

Safety `level` values:

- `clear`
- `sensitive`
- `blocked`
- `crisis`

Common `reasonCodes`:

- `crisis-language`
- `prompt-injection`
- `pii-redacted`
- `unsafe-output-self-harm`
- `unsafe-output-violence`
- `semantic-input-self-harm`
- `semantic-input-unsafe`
- `semantic-input-flagged`
- `semantic-moderation-self-harm`
- `semantic-moderation-unsafe`
- `semantic-moderation-flagged`
- `semantic-moderation-unavailable`

Locale/country context fields:

- `safetyLocale` is an optional IETF language tag (for example, `en-US`).
- `safetyCountry` is an optional ISO 3166-1 alpha-2 country code (for example, `US`).
- If both are omitted, the proxy attempts locale inference from `Accept-Language`.
- Current country-specific crisis routing coverage is: `US`, `CA`, `GB`, `IE`, `AU`, `NZ`.

### `POST /ai/chat/stream`

Request body:

```json
{
  "model": "gpt-4o-mini",
  "stream": true,
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "safetyIdentifier": "hashed_user_identifier",
  "safetyLocale": "en-US",
  "safetyCountry": "US"
}
```

Response format:

- Server-Sent Events (`text/event-stream`)
- each event is prefixed with `data: `
- the stream may emit:
  - `{"type":"meta","safety":{...}}`
  - `{"content":"token"}`
  - `{"type":"error","error":"...","safety":{...}}`
  - `{"type":"done","content":"full message","safety":{...}}`
- if output safety filters trigger during streaming, the proxy emits an updated `meta` safety payload and a `done` event containing a safety fallback message
- the stream terminates with `data: [DONE]`

## Authentication behavior

The proxy supports three auth modes.

### 1. Auth disabled

When `AI_PROXY_REQUIRE_AUTH=false`:

- no bearer token is required
- requests are allowed without auth

### 2. Header-only auth

When:

- `AI_PROXY_REQUIRE_AUTH=true`
- `AI_PROXY_VERIFY_FIREBASE_TOKENS=false`

the proxy:

- requires an `Authorization: Bearer <token>` header
- does **not** verify the token signature

This mode is acceptable for local smoke tests only, not for production.

### 3. Verified Firebase auth

When:

- `AI_PROXY_REQUIRE_AUTH=true`
- `AI_PROXY_VERIFY_FIREBASE_TOKENS=true`

the proxy:

- requires a bearer token
- attempts to verify it with `firebase-admin`
- fails closed if verification is required but `firebase-admin` is unavailable or unconfigured

### Production defaults

When `NODE_ENV=production`, the proxy fails closed unless:

- `AI_PROXY_REQUIRE_AUTH=true`
- `AI_PROXY_VERIFY_FIREBASE_TOKENS=true` (when auth is enabled)

Emergency overrides exist for short-lived incident handling:

- `AI_PROXY_ALLOW_INSECURE_AUTH_IN_PRODUCTION=true`

## Server responsibilities

The current server implementation performs:

- request normalization
- model allowlisting
- request-size limits (`DEFAULT_MAX_BODY_BYTES`) and message-shape limits (count and per-message length)
- local safety assessment (crisis checks run against every user turn in the request)
- locale/country-aware crisis escalation messaging when context is available
- PII redaction for forwarded content
- prompt-injection instruction filtering for forwarded user content
- optional semantic moderation on the latest user message before provider calls
- output-side safety checks for harmful assistant instructions
- buffered streaming release so tokens are safety-checked before client emission
- optional semantic moderation on assistant output via provider moderation endpoint
- semantic moderation cadence controls for streaming responses
- rate limiting (external shared adapter required in production by default)
- CORS allowlisting based on trusted origin configuration
- baseline API hardening headers (`nosniff`, `DENY`, `no-referrer`, conditional HSTS on secure requests)
- structured safety metadata in both sync and streaming responses

## Environment variables

Required:

- `OPENAI_API_KEY`

Optional:

- `AI_PROXY_PORT` (defaults to `8787`)
- `AI_PROXY_ALLOWED_MODELS` (comma-separated allowlist)
- `AI_PROXY_TIMEOUT_MS`
- `AI_PROXY_ALLOWED_ORIGINS` (comma-separated CORS allowlist)
- `AI_PROXY_RATE_LIMIT_STORE_PATH` (path to an external rate-limit adapter module)
- `AI_PROXY_ALLOW_MEMORY_RATE_LIMIT_IN_PRODUCTION` (default `false`; set `true` only for emergency fallback)
- `AI_PROXY_ALLOW_INSECURE_AUTH_IN_PRODUCTION` (default `false`; set `true` only for emergency fallback)
- `AI_PROXY_ENABLE_SEMANTIC_MODERATION=true`
- `AI_PROXY_OUTPUT_MODERATION_MODEL` (defaults to `omni-moderation-latest`)
- `AI_PROXY_SEMANTIC_MODERATION_FAIL_CLOSED` (defaults to `true`; set `false` to fail open)
- `AI_PROXY_SEMANTIC_MODERATION_MIN_CHARS` (defaults to `240`; controls stream moderation cadence)
- `AI_PROXY_MAX_MESSAGES` (defaults to `60`; bounded to `1..200`)
- `AI_PROXY_MAX_MESSAGE_CHARS` (defaults to `4000`; bounded to `64..32000`)
- `AI_PROXY_MAX_SYSTEM_MESSAGE_CHARS` (defaults to `8000`; bounded to `64..64000`)
- `AI_PROXY_REQUIRE_AUTH=true`
- `AI_PROXY_VERIFY_FIREBASE_TOKENS=true`
- `OPENAI_API_BASE_URL`

### CORS behavior

- Requests without an `Origin` header are allowed (native mobile clients).
- Browser requests must match `AI_PROXY_ALLOWED_ORIGINS` unless `*` is explicitly configured.
- `*` is supported for local testing but should not be used in production.

### External rate-limit adapter contract

If `AI_PROXY_RATE_LIMIT_STORE_PATH` is set, the module must export one of:

- `consume(key, { windowMs, maxRequests }) => Promise<{ allowed: boolean, retryAfterSeconds?: number }>`
- `createRateLimitStore()` returning an object with `consume(...)`

When `NODE_ENV=production`, external rate limiting is expected by default. The proxy fails closed without a valid store unless `AI_PROXY_ALLOW_MEMORY_RATE_LIMIT_IN_PRODUCTION=true` is explicitly set.

## Local runtime

Start the proxy locally with:

```bash
OPENAI_API_KEY=your_key_here npm run server:ai-proxy
```

The server now validates startup configuration before it binds a port. It will fail fast if:

- `OPENAI_API_KEY` is missing
- `AI_PROXY_VERIFY_FIREBASE_TOKENS=true` while `AI_PROXY_REQUIRE_AUTH` is not also `true`

For local auth header checks only:

```bash
AI_PROXY_REQUIRE_AUTH=true AI_PROXY_VERIFY_FIREBASE_TOKENS=false npm run server:ai-proxy
```

For real Firebase token verification:

- install `firebase-admin` in the server runtime
- make credentials available to the runtime
- run with:

```bash
AI_PROXY_REQUIRE_AUTH=true AI_PROXY_VERIFY_FIREBASE_TOKENS=true npm run server:ai-proxy
```
