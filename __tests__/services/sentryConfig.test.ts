describe('sentry.config', () => {
  const originalDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  const originalEnableInDev = process.env.EXPO_PUBLIC_ENABLE_SENTRY;

  afterEach(() => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = originalDsn;
    process.env.EXPO_PUBLIC_ENABLE_SENTRY = originalEnableInDev;
    jest.resetModules();
    jest.clearAllMocks();
  });

  const loadSentryConfig = ({
    environment,
    sentryClient,
  }: {
    environment: 'development' | 'production' | 'test';
    sentryClient: {
      init: jest.Mock;
      setUser: jest.Mock;
      captureMessage: jest.Mock;
      captureException: jest.Mock;
    } | null;
  }) => {
    const loggerError = jest.fn();
    let sentryConfig: typeof import('@/src/config/sentry.config');

    jest.isolateModules(() => {
      jest.doMock('@/src/services/observability/sentryAdapter', () => ({
        getSentryClient: () => sentryClient,
      }));

      jest.doMock('@/src/config/env', () => ({
        appEnv: { environment },
      }));

      jest.doMock('@/src/shared/utils/debug', () => ({
        logger: {
          error: loggerError,
          warn: jest.fn(),
          info: jest.fn(),
          debug: jest.fn(),
        },
      }));

      sentryConfig = require('@/src/config/sentry.config');
    });

    return {
      sentryConfig: sentryConfig!,
      loggerError,
    };
  };

  it('does not initialize when DSN is missing', () => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'false';

    const sentryClient = {
      init: jest.fn(),
      setUser: jest.fn(),
      captureMessage: jest.fn(),
      captureException: jest.fn(),
    };

    const { sentryConfig } = loadSentryConfig({
      environment: 'production',
      sentryClient,
    });

    sentryConfig.initSentry();

    expect(sentryClient.init).not.toHaveBeenCalled();
  });

  it('initializes in production when DSN is set', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://example.ingest.sentry.io/1';
    process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'false';

    const sentryClient = {
      init: jest.fn(),
      setUser: jest.fn(),
      captureMessage: jest.fn(),
      captureException: jest.fn(),
    };

    const { sentryConfig } = loadSentryConfig({
      environment: 'production',
      sentryClient,
    });

    sentryConfig.initSentry();

    expect(sentryClient.init).toHaveBeenCalledTimes(1);
    const initOptions = sentryClient.init.mock.calls[0][0];
    expect(initOptions.dsn).toBe('https://example.ingest.sentry.io/1');
    expect(initOptions.tracesSampleRate).toBe(0.1);

    const blockedResult = initOptions.beforeSend(
      { exception: {} },
      { originalException: new Error('ERR_BLOCKED_BY_CLIENT') },
    );
    const allowedEvent = { exception: {} };
    const allowedResult = initOptions.beforeSend(allowedEvent, {
      originalException: new Error('Some other failure'),
    });

    expect(blockedResult).toBeNull();
    expect(allowedResult).toBe(allowedEvent);
  });

  it('forwards context and tags when capturing exceptions', () => {
    const sentryClient = {
      init: jest.fn(),
      setUser: jest.fn(),
      captureMessage: jest.fn(),
      captureException: jest.fn(),
    };

    const { sentryConfig } = loadSentryConfig({
      environment: 'production',
      sentryClient,
    });

    const error = new Error('boom');
    sentryConfig.captureException(error, {
      context: 'Auth flow',
      tags: { errorCode: 'auth/invalid-credential' },
      extra: { attempt: 2 },
    });

    expect(sentryClient.captureException).toHaveBeenCalledWith(error, {
      tags: { errorCode: 'auth/invalid-credential' },
      extra: {
        attempt: 2,
        context: 'Auth flow',
      },
    });
  });

  it('no-ops safely when sentry client is unavailable', () => {
    const { sentryConfig } = loadSentryConfig({
      environment: 'production',
      sentryClient: null,
    });

    expect(() => sentryConfig.captureMessage('test')).not.toThrow();
    expect(() => sentryConfig.captureException(new Error('test'))).not.toThrow();
    expect(() => sentryConfig.setSentryUser('abc')).not.toThrow();
    expect(() => sentryConfig.clearSentryUser()).not.toThrow();
  });
});
