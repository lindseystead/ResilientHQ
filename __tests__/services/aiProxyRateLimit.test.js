const {
  buildRateLimitKey,
  enforceRateLimit,
  resetRateLimitStateForTests,
  setRateLimitStoreForTests,
} = require('../../server/ai-proxy/rateLimit');

describe('AI proxy rate limiting', () => {
  afterEach(() => {
    resetRateLimitStateForTests();
  });

  it('prefers verified user uid as the rate-limit key', () => {
    const req = { headers: {}, socket: { remoteAddress: '127.0.0.1' } };
    const key = buildRateLimitKey(
      req,
      { safetyIdentifier: 'uid_anon' },
      { user: { uid: 'uid_123' } },
    );

    expect(key).toBe('uid_123');
  });

  it('never keys on the client-supplied safety identifier (would allow evasion)', () => {
    // A client-controlled safetyIdentifier must NOT become the rate-limit bucket;
    // otherwise it can be rotated per request to get unlimited fresh buckets.
    const reqWithSafety = { headers: {}, socket: { remoteAddress: '127.0.0.1' } };
    const key = buildRateLimitKey(reqWithSafety, { safetyIdentifier: 'uid_safe' }, null);
    expect(key).not.toBe('uid_safe');
    expect(key).toBe('127.0.0.1');
  });

  it('falls back to the client network address when there is no verified user', () => {
    const reqNoSafety = { headers: {}, socket: { remoteAddress: '127.0.0.2' } };
    const ipKey = buildRateLimitKey(reqNoSafety, {}, null);
    expect(ipKey).toBe('127.0.0.2');
  });

  it('ignores an arbitrary Bearer header for keying', () => {
    const req = {
      headers: { authorization: 'Bearer spoofed-token-value' },
      socket: { remoteAddress: '127.0.0.3' },
    };
    const key = buildRateLimitKey(req, {}, null);
    expect(key).toBe('127.0.0.3');
  });

  it('supports external store adapters through the shared consume interface', async () => {
    const consume = jest
      .fn()
      .mockResolvedValueOnce({ allowed: true, retryAfterSeconds: 0 })
      .mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 42 });

    setRateLimitStoreForTests({
      consume,
    });

    const firstResult = await enforceRateLimit('uid_abc');
    const secondResult = await enforceRateLimit('uid_abc');

    expect(firstResult).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(secondResult).toEqual({ allowed: false, retryAfterSeconds: 42 });
    expect(consume).toHaveBeenCalledTimes(2);
  });
});
