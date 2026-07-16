'use strict';

const DEFAULT_ALLOWED_MODELS = ['gpt-4o-mini', 'gpt-4.1-mini'];
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:19006',
  'http://127.0.0.1:19006',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
const DEFAULT_MAX_BODY_BYTES = 64 * 1024;
const DEFAULT_MAX_MESSAGES = 60;
const DEFAULT_MAX_MESSAGE_CHARS = 4_000;
const DEFAULT_MAX_SYSTEM_MESSAGE_CHARS = 8_000;
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_PORT = 8787;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const DEFAULT_OUTPUT_MODERATION_MODEL = 'omni-moderation-latest';
const DEFAULT_SEMANTIC_MODERATION_MIN_CHARS = 240;
const PRODUCTION_NODE_ENV = 'production';

const isProductionEnvironment = () => process.env.NODE_ENV === PRODUCTION_NODE_ENV;
const shouldAllowInsecureAuthInProduction = () =>
  process.env.AI_PROXY_ALLOW_INSECURE_AUTH_IN_PRODUCTION === 'true';
const shouldAllowMemoryRateLimitInProduction = () =>
  process.env.AI_PROXY_ALLOW_MEMORY_RATE_LIMIT_IN_PRODUCTION === 'true';
const shouldRequireExternalRateLimitStore = () =>
  isProductionEnvironment() && !shouldAllowMemoryRateLimitInProduction();

const parseBoundedIntegerEnv = (value, fallback, minimum, maximum) => {
  const parsed = Number.parseInt(value || '', 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(minimum, Math.min(parsed, maximum));
};

const getAllowedModels = () => {
  const raw = process.env.AI_PROXY_ALLOWED_MODELS;

  if (!raw) {
    return DEFAULT_ALLOWED_MODELS;
  }

  const models = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return models.length > 0 ? models : DEFAULT_ALLOWED_MODELS;
};

const getAllowedOrigins = () => {
  const raw = process.env.AI_PROXY_ALLOWED_ORIGINS;

  if (!raw) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  const origins = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : DEFAULT_ALLOWED_ORIGINS;
};

const shouldRequireAuth = () => process.env.AI_PROXY_REQUIRE_AUTH === 'true';
const shouldVerifyFirebaseTokens = () => process.env.AI_PROXY_VERIFY_FIREBASE_TOKENS === 'true';
const shouldEnableSemanticModeration = () =>
  process.env.AI_PROXY_ENABLE_SEMANTIC_MODERATION === 'true';
const shouldFailClosedOnModerationError = () =>
  process.env.AI_PROXY_SEMANTIC_MODERATION_FAIL_CLOSED !== 'false';

const getOutputModerationModel = () =>
  process.env.AI_PROXY_OUTPUT_MODERATION_MODEL || DEFAULT_OUTPUT_MODERATION_MODEL;

const getSemanticModerationMinChars = () => {
  const parsed = Number.parseInt(process.env.AI_PROXY_SEMANTIC_MODERATION_MIN_CHARS || '', 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_SEMANTIC_MODERATION_MIN_CHARS;
  }

  return Math.max(80, Math.min(parsed, 2_000));
};

const getProxyPort = () => Number.parseInt(process.env.AI_PROXY_PORT || '', 10) || DEFAULT_PORT;

const getProxyTimeoutMs = () =>
  Number.parseInt(process.env.AI_PROXY_TIMEOUT_MS || '', 10) || DEFAULT_TIMEOUT_MS;

const getProxyMaxMessages = () =>
  parseBoundedIntegerEnv(process.env.AI_PROXY_MAX_MESSAGES, DEFAULT_MAX_MESSAGES, 1, 200);

const getProxyMaxMessageChars = () =>
  parseBoundedIntegerEnv(
    process.env.AI_PROXY_MAX_MESSAGE_CHARS,
    DEFAULT_MAX_MESSAGE_CHARS,
    64,
    32_000,
  );

const getProxyMaxSystemMessageChars = () =>
  parseBoundedIntegerEnv(
    process.env.AI_PROXY_MAX_SYSTEM_MESSAGE_CHARS,
    DEFAULT_MAX_SYSTEM_MESSAGE_CHARS,
    64,
    64_000,
  );

const buildOpenAIUrl = (pathname) => {
  const baseUrl = (process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1').replace(
    /\/+$/,
    '',
  );

  return `${baseUrl}${pathname}`;
};

const validateRuntimeConfiguration = () => {
  const errors = [];
  const warnings = [];

  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY is required.');
  }

  if (shouldVerifyFirebaseTokens() && !shouldRequireAuth()) {
    errors.push('AI_PROXY_VERIFY_FIREBASE_TOKENS=true requires AI_PROXY_REQUIRE_AUTH=true.');
  }

  if (shouldRequireAuth() && !shouldVerifyFirebaseTokens()) {
    warnings.push(
      'AI proxy is running in header-only auth mode. Enable AI_PROXY_VERIFY_FIREBASE_TOKENS=true for production verification.',
    );
  }

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes('*')) {
    warnings.push(
      'AI proxy CORS allowlist contains "*". Restrict AI_PROXY_ALLOWED_ORIGINS to trusted origins in production.',
    );
  }

  if (isProductionEnvironment()) {
    if (!shouldRequireAuth() && !shouldAllowInsecureAuthInProduction()) {
      errors.push(
        'AI_PROXY_REQUIRE_AUTH=true is required in production. Set AI_PROXY_ALLOW_INSECURE_AUTH_IN_PRODUCTION=true only for temporary emergency overrides.',
      );
    }

    if (
      shouldRequireAuth() &&
      !shouldVerifyFirebaseTokens() &&
      !shouldAllowInsecureAuthInProduction()
    ) {
      errors.push(
        'AI_PROXY_VERIFY_FIREBASE_TOKENS=true is required in production when auth is enabled. Set AI_PROXY_ALLOW_INSECURE_AUTH_IN_PRODUCTION=true only for temporary emergency overrides.',
      );
    }

    if (shouldRequireExternalRateLimitStore() && !process.env.AI_PROXY_RATE_LIMIT_STORE_PATH) {
      errors.push(
        'AI_PROXY_RATE_LIMIT_STORE_PATH is required in production unless AI_PROXY_ALLOW_MEMORY_RATE_LIMIT_IN_PRODUCTION=true is explicitly set.',
      );
    }

    const hasNonLocalOrigin = allowedOrigins.some((origin) => {
      if (origin === '*') {
        return true;
      }

      return !/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin);
    });

    if (!hasNonLocalOrigin) {
      warnings.push(
        'AI proxy CORS allowlist appears to contain only localhost origins. Set AI_PROXY_ALLOWED_ORIGINS for deployed web clients.',
      );
    }

    if (allowedOrigins.includes('*')) {
      errors.push(
        'AI_PROXY_ALLOWED_ORIGINS must not contain "*" in production. Set an explicit list of trusted origins.',
      );
    }

    // For a mental-health assistant, semantic output moderation is the primary
    // enforced backstop against harmful content, so it is required in production.
    if (!shouldEnableSemanticModeration()) {
      errors.push(
        'AI_PROXY_ENABLE_SEMANTIC_MODERATION=true is required in production. Output safety must not rely on the model behaving.',
      );
    } else if (getSemanticModerationMinChars() < 120) {
      warnings.push(
        'AI_PROXY_SEMANTIC_MODERATION_MIN_CHARS is set below 120. This may increase moderation latency and costs for streaming responses.',
      );
    }
  }

  return { errors, warnings };
};

module.exports = {
  DEFAULT_ALLOWED_MODELS,
  DEFAULT_ALLOWED_ORIGINS,
  DEFAULT_MAX_BODY_BYTES,
  DEFAULT_MAX_MESSAGES,
  DEFAULT_MAX_MESSAGE_CHARS,
  DEFAULT_MAX_SYSTEM_MESSAGE_CHARS,
  DEFAULT_OUTPUT_MODERATION_MODEL,
  DEFAULT_SEMANTIC_MODERATION_MIN_CHARS,
  DEFAULT_TIMEOUT_MS,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  buildOpenAIUrl,
  getOutputModerationModel,
  getSemanticModerationMinChars,
  getAllowedModels,
  getAllowedOrigins,
  getProxyMaxMessageChars,
  getProxyMaxMessages,
  getProxyMaxSystemMessageChars,
  getProxyPort,
  getProxyTimeoutMs,
  isProductionEnvironment,
  shouldAllowInsecureAuthInProduction,
  shouldAllowMemoryRateLimitInProduction,
  shouldEnableSemanticModeration,
  shouldFailClosedOnModerationError,
  shouldRequireExternalRateLimitStore,
  shouldRequireAuth,
  shouldVerifyFirebaseTokens,
  validateRuntimeConfiguration,
};
