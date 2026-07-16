/**
 * AI Safety Context + Crisis Routing
 *
 * Derives locale/country context on-device and resolves region-aware crisis
 * support copy and actions. This keeps crisis escalation behavior consistent
 * between local client guardrails and server-side proxy controls.
 */

export interface AiSafetyContext {
  safetyLocale?: string;
  safetyCountry?: string;
}

export interface CrisisSupportAction {
  label: string;
  url: string;
}

export interface CrisisSupportRouting {
  context: {
    locale?: string;
    countryCode?: string;
  };
  bodyText: string;
  primaryCallAction?: CrisisSupportAction;
  primaryTextAction?: CrisisSupportAction;
  emergencyAction?: CrisisSupportAction;
  directoryAction: CrisisSupportAction;
}

const DEFAULT_CRISIS_DIRECTORY_URL = 'https://findahelpline.com';

interface CrisisRoutingEntry {
  urgentDirective: string;
  emergencyDirective: string;
  primaryCallAction?: CrisisSupportAction;
  primaryTextAction?: CrisisSupportAction;
  emergencyAction?: CrisisSupportAction;
}

const CRISIS_ROUTING_BY_COUNTRY: Record<string, CrisisRoutingEntry> = {
  US: {
    urgentDirective: 'call or text 988 now',
    emergencyDirective: 'call 911',
    primaryCallAction: { label: 'Call 988', url: 'tel:988' },
    primaryTextAction: { label: 'Text 988', url: 'sms:988' },
    emergencyAction: { label: 'Call 911', url: 'tel:911' },
  },
  CA: {
    urgentDirective: 'call or text 988 now',
    emergencyDirective: 'call 911',
    primaryCallAction: { label: 'Call 988', url: 'tel:988' },
    primaryTextAction: { label: 'Text 988', url: 'sms:988' },
    emergencyAction: { label: 'Call 911', url: 'tel:911' },
  },
  GB: {
    urgentDirective: 'call Samaritans at 116 123 now',
    emergencyDirective: 'call 999 or 112',
    primaryCallAction: { label: 'Call Samaritans', url: 'tel:116123' },
    emergencyAction: { label: 'Call 999', url: 'tel:999' },
  },
  IE: {
    urgentDirective: 'call Samaritans at 116 123 now',
    emergencyDirective: 'call 112 or 999',
    primaryCallAction: { label: 'Call Samaritans', url: 'tel:116123' },
    emergencyAction: { label: 'Call 112', url: 'tel:112' },
  },
  AU: {
    urgentDirective: 'call Lifeline at 13 11 14 now',
    emergencyDirective: 'call 000',
    primaryCallAction: { label: 'Call Lifeline', url: 'tel:131114' },
    emergencyAction: { label: 'Call 000', url: 'tel:000' },
  },
  NZ: {
    urgentDirective: 'call or text 1737 now',
    emergencyDirective: 'call 111',
    primaryCallAction: { label: 'Call 1737', url: 'tel:1737' },
    primaryTextAction: { label: 'Text 1737', url: 'sms:1737' },
    emergencyAction: { label: 'Call 111', url: 'tel:111' },
  },
};

const normalizeLocaleTag = (value: unknown): string =>
  typeof value === 'string' ? value.trim().slice(0, 64) : '';

const normalizeCountryCode = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : '';
};

const extractCountryCodeFromLocale = (locale: unknown): string => {
  const normalizedLocale = normalizeLocaleTag(locale).replace(/_/g, '-');
  if (!normalizedLocale) {
    return '';
  }

  const segments = normalizedLocale.split('-').map((segment) => segment.trim());
  const regionSegment = segments.slice(1).find((segment) => /^[A-Za-z]{2}$/.test(segment));
  return normalizeCountryCode(regionSegment ?? '');
};

const resolveRuntimeLocale = (): string => {
  try {
    const fromIntl =
      typeof Intl !== 'undefined' && Intl.DateTimeFormat
        ? Intl.DateTimeFormat().resolvedOptions().locale
        : '';

    if (typeof fromIntl === 'string' && fromIntl.trim().length > 0) {
      return fromIntl.trim();
    }
  } catch {
    // Ignore runtime locale resolution errors and fall through to navigator.
  }

  if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
    return navigator.language.trim();
  }

  return '';
};

export const getDeviceSafetyContext = (): AiSafetyContext => {
  const safetyLocale = normalizeLocaleTag(resolveRuntimeLocale());
  const safetyCountry = extractCountryCodeFromLocale(safetyLocale);

  return {
    safetyLocale: safetyLocale || undefined,
    safetyCountry: safetyCountry || undefined,
  };
};

export const resolveCrisisSupportRouting = (
  context: AiSafetyContext = getDeviceSafetyContext(),
): CrisisSupportRouting => {
  const locale = normalizeLocaleTag(context.safetyLocale);
  const explicitCountry = normalizeCountryCode(context.safetyCountry);
  const inferredCountry = extractCountryCodeFromLocale(locale);
  const countryCode = explicitCountry || inferredCountry;
  const routing = countryCode ? CRISIS_ROUTING_BY_COUNTRY[countryCode] : undefined;

  const bodyText = routing
    ? `If you may act on thoughts of self-harm or feel unsafe right now, ${routing.urgentDirective}. If you are in immediate danger, ${routing.emergencyDirective}.`
    : `If you may act on thoughts of self-harm or feel unsafe right now, contact your local emergency number immediately. You can also find country-specific crisis lines at ${DEFAULT_CRISIS_DIRECTORY_URL}.`;

  return {
    context: {
      locale: locale || undefined,
      countryCode: countryCode || undefined,
    },
    bodyText,
    primaryCallAction: routing?.primaryCallAction,
    primaryTextAction: routing?.primaryTextAction,
    emergencyAction: routing?.emergencyAction,
    directoryAction: {
      label: 'Find Local Hotline',
      url: DEFAULT_CRISIS_DIRECTORY_URL,
    },
  };
};

export const buildLocalizedCrisisSupportMessage = (
  context: AiSafetyContext = getDeviceSafetyContext(),
): string => {
  const routing = resolveCrisisSupportRouting(context);

  return `I'm concerned you may be in immediate distress. I'm not a crisis service. ${routing.bodyText} If you can, reach out to a trusted person nearby now. If you're safe enough to keep talking, tell me whether you're alone and we can focus on one small grounding step together.`;
};
