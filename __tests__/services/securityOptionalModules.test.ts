describe('security optional modules', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const loadSecurityModules = (options: {
    screenCapture?: unknown;
    blurModule?: { BlurView?: unknown } | null;
  }) => {
    const loadOptionalModuleMock = jest.fn((moduleId: string) => {
      if (moduleId === 'expo-screen-capture') {
        return options.screenCapture ?? null;
      }

      if (moduleId === 'expo-blur') {
        return options.blurModule ?? null;
      }

      return null;
    });

    let securityOptionalModules: { screenCapture: unknown; BlurView: unknown | null } | undefined;

    jest.isolateModules(() => {
      jest.doMock('@/src/shared/utils/runtime/optionalModule', () => ({
        loadOptionalModule: loadOptionalModuleMock,
      }));

      ({ securityOptionalModules } = require('@/src/services/security/securityOptionalModules'));
    });

    return {
      securityOptionalModules: securityOptionalModules as {
        screenCapture: unknown;
        BlurView: unknown | null;
      },
      loadOptionalModuleMock,
    };
  };

  it('returns both optional modules when available', () => {
    const screenCaptureModule = {
      preventScreenCaptureAsync: jest.fn(),
      allowScreenCaptureAsync: jest.fn(),
      addScreenshotListener: jest.fn(),
    };
    const blurViewComponent = () => null;

    const { securityOptionalModules, loadOptionalModuleMock } = loadSecurityModules({
      screenCapture: screenCaptureModule,
      blurModule: { BlurView: blurViewComponent },
    });

    expect(loadOptionalModuleMock).toHaveBeenNthCalledWith(1, 'expo-screen-capture');
    expect(loadOptionalModuleMock).toHaveBeenNthCalledWith(2, 'expo-blur');
    expect(securityOptionalModules.screenCapture).toBe(screenCaptureModule);
    expect(securityOptionalModules.BlurView).toBe(blurViewComponent);
  });

  it('returns null entries when optional modules are unavailable', () => {
    const { securityOptionalModules } = loadSecurityModules({
      screenCapture: null,
      blurModule: null,
    });

    expect(securityOptionalModules.screenCapture).toBeNull();
    expect(securityOptionalModules.BlurView).toBeNull();
  });
});
