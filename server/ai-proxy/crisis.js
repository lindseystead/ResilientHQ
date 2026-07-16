'use strict';

const DEFAULT_CRISIS_DIRECTORY_URL = 'https://findahelpline.com';

const CRISIS_ROUTING_BY_COUNTRY = {
  US: {
    urgentDirective: 'call or text 988 now',
    emergencyDirective: 'call 911',
  },
  CA: {
    urgentDirective: 'call or text 988 now',
    emergencyDirective: 'call 911',
  },
  GB: {
    urgentDirective: 'call Samaritans at 116 123 now',
    emergencyDirective: 'call 999 or 112',
  },
  IE: {
    urgentDirective: 'call Samaritans at 116 123 now',
    emergencyDirective: 'call 112 or 999',
  },
  AU: {
    urgentDirective: 'call Lifeline at 13 11 14 now',
    emergencyDirective: 'call 000',
  },
  NZ: {
    urgentDirective: 'call or text 1737 now',
    emergencyDirective: 'call 111',
  },
};

const normalizeLocaleTag = (value) => (typeof value === 'string' ? value.trim().slice(0, 64) : '');

const normalizeCountryCode = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : '';
};

const extractCountryCodeFromLocale = (locale) => {
  const normalizedLocale = normalizeLocaleTag(locale).replace(/_/g, '-');
  if (!normalizedLocale) {
    return '';
  }

  const segments = normalizedLocale.split('-').map((segment) => segment.trim());
  const regionSegment = segments.slice(1).find((segment) => /^[A-Za-z]{2}$/.test(segment));
  return normalizeCountryCode(regionSegment || '');
};

const resolveCrisisRoutingContext = (context = {}) => {
  const locale = normalizeLocaleTag(context.locale);
  const explicitCountryCode = normalizeCountryCode(context.countryCode);
  const inferredCountryCode = extractCountryCodeFromLocale(locale);
  const countryCode = explicitCountryCode || inferredCountryCode;

  return {
    locale: locale || undefined,
    countryCode: countryCode || undefined,
    routing: (countryCode && CRISIS_ROUTING_BY_COUNTRY[countryCode]) || {
      urgentDirective:
        'call your local emergency number now, or use local crisis support if available',
      emergencyDirective: `contact emergency services immediately`,
    },
    directoryUrl: DEFAULT_CRISIS_DIRECTORY_URL,
  };
};

const buildCrisisEscalationMessage = (context = {}) => {
  const routingContext = resolveCrisisRoutingContext(context);
  const hasCountryRouting = Boolean(routingContext.countryCode);
  const escalationLine = hasCountryRouting
    ? `If you may act on thoughts of self-harm or feel unsafe right now, ${routingContext.routing.urgentDirective}. If you are in immediate danger, ${routingContext.routing.emergencyDirective}.`
    : `If you may act on thoughts of self-harm or feel unsafe right now, ${routingContext.routing.urgentDirective}. You can find country-specific crisis lines at ${routingContext.directoryUrl}.`;

  return `I am concerned you may be in immediate danger. I'm not a crisis service and can't help in an emergency, but people who can are available right now. ${escalationLine} If you can, reach out to a trusted person nearby. If you're safe enough to keep talking, tell me whether you're alone and we can focus on one small grounding step together.`;
};

const buildSelfHarmInstructionBlockMessage = (context = {}) => {
  const routingContext = resolveCrisisRoutingContext(context);
  const hasCountryRouting = Boolean(routingContext.countryCode);
  const supportLine = hasCountryRouting
    ? `If you feel unsafe right now, ${routingContext.routing.urgentDirective}. If you are in immediate danger, ${routingContext.routing.emergencyDirective}.`
    : `If you feel unsafe right now, contact local emergency services immediately. You can find country-specific crisis lines at ${routingContext.directoryUrl}.`;

  return `I can’t provide instructions that could cause harm. ${supportLine}`;
};

module.exports = {
  buildCrisisEscalationMessage,
  buildSelfHarmInstructionBlockMessage,
  extractCountryCodeFromLocale,
  normalizeCountryCode,
  normalizeLocaleTag,
  resolveCrisisRoutingContext,
};
