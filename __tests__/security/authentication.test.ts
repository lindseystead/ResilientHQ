const restoreEnv = (snapshot: Record<string, string | undefined>) => {
  Object.keys(process.env).forEach((key) => {
    if (!(key in snapshot)) {
      delete process.env[key];
    }
  });

  Object.entries(snapshot).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
      return;
    }
    process.env[key] = value;
  });
};

const loadAuthModule = () => {
  jest.resetModules();
  return require('../../server/ai-proxy/auth');
};

const loadConfigModule = () => {
  jest.resetModules();
  return require('../../server/ai-proxy/config');
};

describe('Security - Authentication', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    restoreEnv(originalEnv);
    jest.resetModules();
  });

  it('rejects requests missing bearer tokens when auth is required', async () => {
    process.env.AI_PROXY_REQUIRE_AUTH = 'true';
    process.env.AI_PROXY_VERIFY_FIREBASE_TOKENS = 'false';

    const { verifyRequestAuth } = loadAuthModule();
    const result = await verifyRequestAuth({ headers: {} });

    expect(result.allowed).toBe(false);
    expect(result.status).toBe(401);
    expect(result.message).toContain('Authorization is required');
  });

  it('supports local header-only mode only when explicitly configured', async () => {
    process.env.AI_PROXY_REQUIRE_AUTH = 'true';
    process.env.AI_PROXY_VERIFY_FIREBASE_TOKENS = 'false';

    const { verifyRequestAuth } = loadAuthModule();
    const result = await verifyRequestAuth({
      headers: { authorization: 'Bearer local-test-token' },
    });

    expect(result.allowed).toBe(true);
    expect(result.mode).toBe('header-only');
  });

  it('enforces fail-closed production auth configuration by default', () => {
    process.env.NODE_ENV = 'production';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.AI_PROXY_REQUIRE_AUTH = 'false';
    process.env.AI_PROXY_VERIFY_FIREBASE_TOKENS = 'false';
    process.env.AI_PROXY_ALLOW_MEMORY_RATE_LIMIT_IN_PRODUCTION = 'true';
    delete process.env.AI_PROXY_ALLOW_INSECURE_AUTH_IN_PRODUCTION;

    const { validateRuntimeConfiguration } = loadConfigModule();
    const validation = validateRuntimeConfiguration();

    expect(validation.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('AI_PROXY_REQUIRE_AUTH=true is required')]),
    );
  });

  it('allows emergency override mode only when explicit override flags are set', () => {
    process.env.NODE_ENV = 'production';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.AI_PROXY_REQUIRE_AUTH = 'false';
    process.env.AI_PROXY_VERIFY_FIREBASE_TOKENS = 'false';
    process.env.AI_PROXY_ALLOW_INSECURE_AUTH_IN_PRODUCTION = 'true';
    process.env.AI_PROXY_ALLOW_MEMORY_RATE_LIMIT_IN_PRODUCTION = 'true';
    // A valid production config still requires output moderation and explicit
    // origins; the emergency flags only override auth and the rate-limit store.
    process.env.AI_PROXY_ENABLE_SEMANTIC_MODERATION = 'true';
    process.env.AI_PROXY_ALLOWED_ORIGINS = 'https://app.example.com';

    const { validateRuntimeConfiguration } = loadConfigModule();
    const validation = validateRuntimeConfiguration();

    expect(validation.errors).toHaveLength(0);
  });
});
