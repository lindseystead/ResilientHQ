const { getResponseHeaders, isCorsOriginAllowed } = require('../../server/ai-proxy/http');

describe('AI proxy HTTP CORS behavior', () => {
  const originalAllowedOrigins = process.env.AI_PROXY_ALLOWED_ORIGINS;

  afterEach(() => {
    process.env.AI_PROXY_ALLOWED_ORIGINS = originalAllowedOrigins;
  });

  it('allows configured browser origins and echoes Access-Control-Allow-Origin', () => {
    process.env.AI_PROXY_ALLOWED_ORIGINS = 'https://app.example.com,https://preview.example.com';
    const req = {
      headers: {
        origin: 'https://app.example.com',
      },
    };

    expect(isCorsOriginAllowed(req)).toBe(true);
    expect(getResponseHeaders(req)['Access-Control-Allow-Origin']).toBe('https://app.example.com');
  });

  it('blocks non-allowlisted browser origins', () => {
    process.env.AI_PROXY_ALLOWED_ORIGINS = 'https://app.example.com';
    const req = {
      headers: {
        origin: 'https://attacker.example.com',
      },
    };

    expect(isCorsOriginAllowed(req)).toBe(false);
    expect(getResponseHeaders(req)['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('allows requests with no origin header (native/mobile clients)', () => {
    process.env.AI_PROXY_ALLOWED_ORIGINS = 'https://app.example.com';
    const req = {
      headers: {},
    };

    expect(isCorsOriginAllowed(req)).toBe(true);
  });

  it('includes baseline security headers on responses', () => {
    const req = {
      headers: {
        origin: 'https://app.example.com',
      },
      socket: {},
    };

    process.env.AI_PROXY_ALLOWED_ORIGINS = 'https://app.example.com';
    const headers = getResponseHeaders(req);

    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('no-referrer');
    expect(headers['Cross-Origin-Resource-Policy']).toBe('same-origin');
  });

  it('adds HSTS only for secure requests', () => {
    process.env.AI_PROXY_ALLOWED_ORIGINS = 'https://app.example.com';

    const secureHeaders = getResponseHeaders({
      headers: {
        origin: 'https://app.example.com',
        'x-forwarded-proto': 'https',
      },
      socket: {},
    });
    const insecureHeaders = getResponseHeaders({
      headers: {
        origin: 'https://app.example.com',
      },
      socket: {},
    });

    expect(secureHeaders['Strict-Transport-Security']).toContain('max-age=31536000');
    expect(insecureHeaders['Strict-Transport-Security']).toBeUndefined();
  });
});
