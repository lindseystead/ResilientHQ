import {
  buildLocalizedCrisisSupportMessage,
  getDeviceSafetyContext,
  resolveCrisisSupportRouting,
} from '@/src/domains/ai/safetyContext';

describe('AI safety context', () => {
  it('returns U.S. crisis routing actions when country is US', () => {
    const routing = resolveCrisisSupportRouting({ safetyCountry: 'US' });

    expect(routing.primaryCallAction?.url).toBe('tel:988');
    expect(routing.primaryTextAction?.url).toBe('sms:988');
    expect(routing.emergencyAction?.url).toBe('tel:911');
  });

  it('returns UK-specific crisis routing for GB contexts', () => {
    const routing = resolveCrisisSupportRouting({ safetyLocale: 'en-GB' });

    expect(routing.primaryCallAction?.url).toBe('tel:116123');
    expect(routing.primaryTextAction).toBeUndefined();
    expect(routing.emergencyAction?.url).toBe('tel:999');
  });

  it('falls back to local hotline directory when country is not resolved', () => {
    const routing = resolveCrisisSupportRouting({ safetyLocale: 'en' });

    expect(routing.primaryCallAction).toBeUndefined();
    expect(routing.bodyText).toContain('findahelpline.com');
    expect(routing.directoryAction.url).toBe('https://findahelpline.com');
  });

  it('builds localized crisis support copy for known country routes', () => {
    const message = buildLocalizedCrisisSupportMessage({ safetyCountry: 'NZ' });

    expect(message).toContain('1737');
    expect(message).toContain('111');
  });

  it('derives device safety context from runtime locale', () => {
    const originalDateTimeFormat = Intl.DateTimeFormat;
    const dateTimeFormatMock = jest.fn(
      () =>
        ({
          resolvedOptions: () => ({
            locale: 'en-AU',
          }),
        }) as Intl.DateTimeFormat,
    );

    Object.defineProperty(Intl, 'DateTimeFormat', {
      configurable: true,
      value: dateTimeFormatMock,
    });

    try {
      const context = getDeviceSafetyContext();

      expect(context.safetyLocale).toBe('en-AU');
      expect(context.safetyCountry).toBe('AU');
    } finally {
      Object.defineProperty(Intl, 'DateTimeFormat', {
        configurable: true,
        value: originalDateTimeFormat,
      });
    }
  });
});
