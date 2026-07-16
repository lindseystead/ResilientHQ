# Offline Sync Contract

Last updated: March 9, 2026

This document defines the current offline write queue behavior used by the mobile app.

## Scope

Offline replay currently covers transient-failure retries for:

- mood log creation
- journal entry creation
- community post creation
- community comment creation

## Storage model

- Queue metadata is stored in `AsyncStorage` with the prefix `@resilienthq_queue:`.
- Queue payloads are stored via secure storage and referenced by `payloadRef` (prefix `queue-payload:`).
- Queue size is bounded to `250` items.
- Queue item TTL is `7` days. Expired items are removed when the queue is read.
- Items use incremental retry tracking and are removed after 3 failed attempts.

Primary implementation: `src/services/offline/cache.ts`.

## Typed action contract

Action names and payload shapes are defined in `src/services/offline/queueActions.ts`.

Current action names:

- `wellbeing.saveMoodLog`
- `wellbeing.saveJournalEntry`
- `community.createPost`
- `community.addComment`

## Replay processor contract

`CacheService.processQueue(processor)` accepts a processor that returns:

- `true`: item completed, remove from queue
- `false`: item failed, increment retries
- `'defer'`: keep item without consuming retries

Returned summary shape:

- `total`
- `processed`
- `failed`
- `deferred`
- `removed`
- `remaining`
- `wasOnline`

If device is offline, replay returns immediately with `wasOnline: false` and no mutations.

## Routing behavior

Queue replay is routed through `processOfflineQueueItem` in `src/services/offline/queueProcessor.ts`.

Rules:

- No authenticated user: return `'defer'`.
- Payload `userId` mismatch vs current user: return `'defer'`.
- Invalid payloads: log warning and return `true` (drop malformed item).
- Unknown actions: log warning and return `true` (drop unsupported item).
- Replay calls domain services with `allowOfflineQueue: false` to avoid re-queue loops.

## Force Sync behavior

Settings screen force sync uses queue replay and reports deterministic outcomes:

- `Offline`: device not connected
- `Up to Date`: no queued items
- `Sync Deferred`: all queued items deferred for account mismatch
- `Sync Partially Complete`: some items processed, some still queued/failed
- `Success`: all queued items processed

Implementation: `src/features/settings/hooks/useSettingsActions.ts`.

## Extension rules

When adding new offline-replay actions:

1. Add a typed action constant and payload interface in `queueActions.ts`.
2. Add queue fallback in the domain write path using retryable-error gating.
3. Add routing + payload validation in `queueProcessor.ts`.
4. Add unit tests for queue processing summary and routing behavior.
5. Update this document and `CHANGELOG.md` in the same change set.
