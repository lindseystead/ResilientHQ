const { verifyRequestAuth } = require('../../server/ai-proxy/auth');

const createRequest = (authorization) => ({
  headers: authorization ? { authorization } : {},
});

describe('AI proxy auth', () => {
  const originalRequireAuth = process.env.AI_PROXY_REQUIRE_AUTH;
  const originalVerifyTokens = process.env.AI_PROXY_VERIFY_FIREBASE_TOKENS;

  afterEach(() => {
    process.env.AI_PROXY_REQUIRE_AUTH = originalRequireAuth;
    process.env.AI_PROXY_VERIFY_FIREBASE_TOKENS = originalVerifyTokens;
  });

  it('allows requests when auth is disabled', async () => {
    process.env.AI_PROXY_REQUIRE_AUTH = 'false';
    process.env.AI_PROXY_VERIFY_FIREBASE_TOKENS = 'false';

    const result = await verifyRequestAuth(createRequest());

    expect(result.allowed).toBe(true);
    expect(result.mode).toBe('disabled');
  });

  it('accepts bearer headers when verification is not enabled', async () => {
    process.env.AI_PROXY_REQUIRE_AUTH = 'true';
    process.env.AI_PROXY_VERIFY_FIREBASE_TOKENS = 'false';

    const result = await verifyRequestAuth(createRequest('Bearer abc.def.ghi'));

    expect(result.allowed).toBe(true);
    expect(result.mode).toBe('header-only');
  });

  it('fails closed when firebase verification is required but unavailable', async () => {
    process.env.AI_PROXY_REQUIRE_AUTH = 'true';
    process.env.AI_PROXY_VERIFY_FIREBASE_TOKENS = 'true';

    const result = await verifyRequestAuth(createRequest('Bearer abc.def.ghi'));

    expect(result.allowed).toBe(false);
    expect(result.status).toBe(503);
    expect(result.message).toContain('firebase-admin');
  });
});
