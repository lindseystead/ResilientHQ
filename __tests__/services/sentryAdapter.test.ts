describe('sentry adapter', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const loadAdapter = (platformOS: 'ios' | 'android' | 'web', sentryModule: unknown) => {
    const loadOptionalModuleMock = jest.fn(() => sentryModule);
    let getSentryClient: (() => unknown) | undefined;

    jest.isolateModules(() => {
      jest.doMock('react-native', () => ({
        Platform: {
          OS: platformOS,
        },
      }));

      jest.doMock('@/src/shared/utils/runtime/optionalModule', () => ({
        loadOptionalModule: loadOptionalModuleMock,
      }));

      ({ getSentryClient } = require('@/src/services/observability/sentryAdapter'));
    });

    return {
      getSentryClient: getSentryClient as () => unknown,
      loadOptionalModuleMock,
    };
  };

  it('does not attempt to load native sentry on web', () => {
    const { getSentryClient, loadOptionalModuleMock } = loadAdapter('web', { init: jest.fn() });

    expect(loadOptionalModuleMock).not.toHaveBeenCalled();
    expect(getSentryClient()).toBeNull();
  });

  it('loads native sentry on non-web platforms', () => {
    const sentryClient = { init: jest.fn(), captureException: jest.fn() };
    const { getSentryClient, loadOptionalModuleMock } = loadAdapter('ios', sentryClient);

    expect(loadOptionalModuleMock).toHaveBeenCalledWith('@sentry/react-native');
    expect(getSentryClient()).toBe(sentryClient);
  });
});
