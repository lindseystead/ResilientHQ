const restoreEnv = (snapshot) => {
  Object.keys(process.env).forEach((key) => {
    if (!(key in snapshot)) {
      delete process.env[key];
    }
  });

  Object.entries(snapshot).forEach(([key, value]) => {
    process.env[key] = value;
  });
};

const loadConfig = () => {
  jest.resetModules();
  return require('../../server/ai-proxy/config');
};

describe('AI proxy runtime configuration', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    restoreEnv(originalEnv);
    jest.resetModules();
  });

  it('fails closed in production when auth is disabled', () => {
    process.env.NODE_ENV = 'production';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.AI_PROXY_REQUIRE_AUTH = 'false';
    process.env.AI_PROXY_VERIFY_FIREBASE_TOKENS = 'false';
    process.env.AI_PROXY_ALLOW_MEMORY_RATE_LIMIT_IN_PRODUCTION = 'true';

    const { validateRuntimeConfiguration } = loadConfig();
    const result = validateRuntimeConfiguration();

    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('AI_PROXY_REQUIRE_AUTH=true is required')]),
    );
  });

  it('fails closed in production when token verification is disabled', () => {
    process.env.NODE_ENV = 'production';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.AI_PROXY_REQUIRE_AUTH = 'true';
    process.env.AI_PROXY_VERIFY_FIREBASE_TOKENS = 'false';
    process.env.AI_PROXY_ALLOW_MEMORY_RATE_LIMIT_IN_PRODUCTION = 'true';

    const { validateRuntimeConfiguration } = loadConfig();
    const result = validateRuntimeConfiguration();

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('AI_PROXY_VERIFY_FIREBASE_TOKENS=true is required'),
      ]),
    );
  });

  it('requires an external rate-limit store in production by default', () => {
    process.env.NODE_ENV = 'production';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.AI_PROXY_REQUIRE_AUTH = 'true';
    process.env.AI_PROXY_VERIFY_FIREBASE_TOKENS = 'true';
    delete process.env.AI_PROXY_RATE_LIMIT_STORE_PATH;
    delete process.env.AI_PROXY_ALLOW_MEMORY_RATE_LIMIT_IN_PRODUCTION;

    const { shouldRequireExternalRateLimitStore, validateRuntimeConfiguration } = loadConfig();
    const result = validateRuntimeConfiguration();

    expect(shouldRequireExternalRateLimitStore()).toBe(true);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('AI_PROXY_RATE_LIMIT_STORE_PATH is required'),
      ]),
    );
  });

  it('allows explicit production overrides for emergency fallback modes', () => {
    process.env.NODE_ENV = 'production';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.AI_PROXY_REQUIRE_AUTH = 'false';
    process.env.AI_PROXY_VERIFY_FIREBASE_TOKENS = 'false';
    process.env.AI_PROXY_ALLOW_INSECURE_AUTH_IN_PRODUCTION = 'true';
    process.env.AI_PROXY_ALLOW_MEMORY_RATE_LIMIT_IN_PRODUCTION = 'true';
    // Output moderation and explicit origins are still required in production;
    // the emergency flags only override auth and the rate-limit store.
    process.env.AI_PROXY_ENABLE_SEMANTIC_MODERATION = 'true';
    process.env.AI_PROXY_ALLOWED_ORIGINS = 'https://app.example.com';

    const { validateRuntimeConfiguration } = loadConfig();
    const result = validateRuntimeConfiguration();

    expect(result.errors).toEqual([]);
  });

  it('parses bounded message limit configuration', () => {
    process.env.AI_PROXY_MAX_MESSAGES = '500';
    process.env.AI_PROXY_MAX_MESSAGE_CHARS = '999999';
    process.env.AI_PROXY_MAX_SYSTEM_MESSAGE_CHARS = '32';

    const { getProxyMaxMessageChars, getProxyMaxMessages, getProxyMaxSystemMessageChars } =
      loadConfig();

    expect(getProxyMaxMessages()).toBe(200);
    expect(getProxyMaxMessageChars()).toBe(32000);
    expect(getProxyMaxSystemMessageChars()).toBe(64);
  });
});
