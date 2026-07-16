'use strict';

const path = require('node:path');

const {
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  shouldRequireExternalRateLimitStore,
} = require('./config');

const createMemoryRateLimitStore = () => {
  const buckets = new Map();

  return {
    kind: 'memory',
    consume: async (key, options) => {
      const windowMs =
        options && typeof options.windowMs === 'number' ? options.windowMs : RATE_LIMIT_WINDOW_MS;
      const maxRequests =
        options && typeof options.maxRequests === 'number'
          ? options.maxRequests
          : RATE_LIMIT_MAX_REQUESTS;
      const now = Date.now();
      const bucket = buckets.get(key);

      if (!bucket || now - bucket.windowStart >= windowMs) {
        buckets.set(key, { count: 1, windowStart: now });
        return { allowed: true, retryAfterSeconds: 0 };
      }

      if (bucket.count >= maxRequests) {
        return {
          allowed: false,
          retryAfterSeconds: Math.ceil((bucket.windowStart + windowMs - now) / 1000),
        };
      }

      bucket.count += 1;
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
};

let activeStore = null;
let externalStoreLoadAttempted = false;

const getClientAddress = (req) => {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || 'unknown';
};

// Only a verified user id or the network address may key the limiter. Client-
// supplied fields (safetyIdentifier, arbitrary Bearer headers) must never be the
// bucket key: an attacker could rotate them per request to evade the limit and
// run up unbounded provider cost. `requestBody` is intentionally ignored here.
const buildRateLimitKey = (req, requestBody, authContext) => {
  if (authContext && authContext.user && authContext.user.uid) {
    return authContext.user.uid;
  }

  return getClientAddress(req);
};

const normalizeRateLimitResult = (result) => {
  if (!result || typeof result !== 'object') {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (typeof result.allowed !== 'boolean') {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (result.allowed) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: false,
    retryAfterSeconds:
      typeof result.retryAfterSeconds === 'number' && result.retryAfterSeconds > 0
        ? Math.ceil(result.retryAfterSeconds)
        : 1,
  };
};

const loadExternalStore = () => {
  if (externalStoreLoadAttempted) {
    return null;
  }

  externalStoreLoadAttempted = true;
  const modulePath = process.env.AI_PROXY_RATE_LIMIT_STORE_PATH;

  if (!modulePath) {
    if (shouldRequireExternalRateLimitStore()) {
      throw new Error(
        'AI_PROXY_RATE_LIMIT_STORE_PATH is required when external rate limiting is enforced.',
      );
    }
    return null;
  }

  const resolvedPath = path.isAbsolute(modulePath)
    ? modulePath
    : path.resolve(process.cwd(), modulePath);

  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const loadedModule = require(resolvedPath);
    const store =
      typeof loadedModule.createRateLimitStore === 'function'
        ? loadedModule.createRateLimitStore()
        : loadedModule;

    if (!store || typeof store.consume !== 'function') {
      throw new Error('Store module must export consume() or createRateLimitStore().');
    }

    return {
      kind: 'external',
      consume: (key, options) => store.consume(key, options),
    };
  } catch (error) {
    if (shouldRequireExternalRateLimitStore()) {
      throw new Error(
        `Failed to load required external rate-limit store (${resolvedPath}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    process.stdout.write(
      `[ai-proxy] Warning: Failed to load external rate-limit store (${resolvedPath}). Falling back to memory store. ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return null;
  }
};

const getRateLimitStore = () => {
  if (activeStore) {
    return activeStore;
  }

  const externalStore = loadExternalStore();

  if (externalStore) {
    activeStore = externalStore;
    return activeStore;
  }

  if (shouldRequireExternalRateLimitStore()) {
    throw new Error('External rate-limit store is required but unavailable.');
  }

  activeStore = createMemoryRateLimitStore();
  return activeStore;
};

const enforceRateLimit = async (key) => {
  const store = getRateLimitStore();

  try {
    const result = await store.consume(key, {
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
    });
    return normalizeRateLimitResult(result);
  } catch (error) {
    if (shouldRequireExternalRateLimitStore()) {
      throw new Error(
        `Required rate-limit store failed for key "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    process.stdout.write(
      `[ai-proxy] Warning: Rate-limit store error for key "${key}". Using in-memory fallback. ${error instanceof Error ? error.message : String(error)}\n`,
    );

    activeStore = createMemoryRateLimitStore();
    const result = await activeStore.consume(key, {
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
    });
    return normalizeRateLimitResult(result);
  }
};

const setRateLimitStoreForTests = (store) => {
  activeStore = store;
};

const resetRateLimitStateForTests = () => {
  activeStore = null;
  externalStoreLoadAttempted = false;
};

module.exports = {
  buildRateLimitKey,
  createMemoryRateLimitStore,
  enforceRateLimit,
  resetRateLimitStateForTests,
  setRateLimitStoreForTests,
};
