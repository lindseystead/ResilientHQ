'use strict';

const {
  DEFAULT_ALLOWED_MODELS,
  getAllowedModels,
  getProxyMaxMessageChars,
  getProxyMaxMessages,
  getProxyMaxSystemMessageChars,
} = require('./config');
const {
  buildCrisisEscalationMessage,
  buildSelfHarmInstructionBlockMessage,
  normalizeCountryCode,
  resolveCrisisRoutingContext,
} = require('./crisis');

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g;
const LONG_DIGIT_PATTERN = /\b\d{9,}\b/g;

// High-recall crisis detection. IMPORTANT: keep in sync with CRISIS_PATTERNS in
// src/features/chatbot/utils/guardrails.ts. Both are covered by tests asserting
// the same canonical phrases are detected. A false positive is low-harm; a false
// negative (missing a real crisis) is catastrophic, so this list is broad.
const CRISIS_PATTERNS = [
  /\b(?:kill|hang|harm|hurt|cut|shoot|drown) (?:myself|me)\b/i,
  /\b(?:killing|hanging|hurting|cutting) myself\b/i,
  /\bslit (?:my|the) wrists?\b/i,
  /\bjump(?:ing)? (?:off|in front of|from)\b/i,
  /\b(?:want|wanting|going) to die\b/i,
  /\bwish (?:i was|i were|i could be|to be) dead\b/i,
  /\bdon'?t want to (?:be here|live|exist|wake up)(?: anymore)?\b/i,
  /\b(?:want|need) (?:it|this|everything|the pain) to (?:stop|end)\b/i,
  /\bmake it (?:all )?stop\b/i,
  /\bend(?:ing)? (?:my life|it all)\b/i,
  /\bend it all\b/i,
  /\b(?:better off|be better) (?:dead|off dead|without me)\b/i,
  /\bno reason to (?:live|go on|keep going)\b/i,
  /\bnot worth living\b/i,
  /\bcan'?t (?:go on|do this anymore|keep going|stay safe|take (?:it|this) anymore)\b/i,
  /\bno(?:body| one) (?:would|will) miss me\b/i,
  /\bevery(?:one|body)(?:'?s| is| would be)? better (?:off )?without me\b/i,
  /\b(?:this is|writing) my (?:last|final) (?:message|goodbye|note)\b/i,
  /\b(?:suicide|goodbye) (?:note|letter|forever)\b/i,
  /\bself[-\s]?harm(?:ing)?\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\bsuicide plan\b/i,
  /\b(?:have|got|made) a plan to (?:die|kill|end)\b/i,
  /\bready to (?:die|end (?:it|my life))\b/i,
  /\b(?:overdose|od on|ending it all)\b/i,
  /\b(?:took|taken|swallowed) (?:a bunch of |all (?:my|the) )?(?:pills|meds|medication|drugs)\b/i,
  /\b(?:kill|hurt|harm) (?:someone|somebody|others|people|them)\b/i,
  /\bviolent urges\b/i,
  /\b(?:quiero morir|quiero matarme|me quiero matar|no quiero vivir|suicid(?:io|arme))\b/i,
  /\bhacerme dano\b/i,
  /\bno puedo (?:mas|seguir)\b/i,
];

const normalizeForCrisisMatch = (text) =>
  String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const hasCrisisLanguage = (text) => {
  const normalized = normalizeForCrisisMatch(text);
  return CRISIS_PATTERNS.some((pattern) => pattern.test(normalized));
};

const PROMPT_INJECTION_PATTERNS = [
  /\bignore (all|previous|prior) instructions\b/i,
  /\b(reveal|show|print) (the )?(system|developer) prompt\b/i,
  /\bpretend to be\b/i,
  /\bact as\b/i,
];

const PROMPT_INJECTION_REPLACEMENTS = [
  {
    pattern: /\bignore (all|previous|prior) instructions\b/gi,
    replacement: '[filtered-instruction]',
  },
  {
    pattern: /\b(reveal|show|print) (the )?(system|developer) prompt\b/gi,
    replacement: '[filtered-system-prompt-request]',
  },
  {
    pattern: /\bpretend to be\b/gi,
    replacement: '[filtered-role-manipulation]',
  },
  {
    pattern: /\bact as\b/gi,
    replacement: '[filtered-role-manipulation]',
  },
];

const OUTPUT_SELF_HARM_INSTRUCTION_PATTERNS = [
  /\b(how to|ways to|best way to|steps to)\b[^.!?\n]{0,120}\b(kill yourself|end your life|suicide|self[-\s]?harm|hurt yourself)\b/i,
  /\b(take|swallow|mix|combine|use)\b[^.!?\n]{0,120}\b(pills|medication|drugs|alcohol|blade|rope|gun)\b[^.!?\n]{0,120}\b(to die|to end your life|for suicide|for self[-\s]?harm)\b/i,
];

const OUTPUT_VIOLENCE_INSTRUCTION_PATTERNS = [
  /\b(how to|ways to|steps to)\b[^.!?\n]{0,120}\b(kill someone|hurt someone|harm others|attack someone)\b/i,
  /\b(build|make|assemble)\b[^.!?\n]{0,80}\b(bomb|explosive|molotov)\b/i,
];

const SAFETY_LEVEL_PRIORITY = {
  clear: 0,
  sensitive: 1,
  blocked: 2,
  crisis: 3,
};

const unique = (items) => Array.from(new Set(items));

const buildSafetyResult = (overrides = {}) => ({
  level: 'clear',
  blocked: false,
  shouldEscalate: false,
  reasonCodes: [],
  redactedTypes: [],
  ...overrides,
});

const normalizeCategoryKey = (value) =>
  typeof value === 'string' ? value.toLowerCase().replace(/_/g, '-').trim() : '';

const getFlaggedModerationCategories = (categories) => {
  if (!categories || typeof categories !== 'object') {
    return [];
  }

  return Object.entries(categories)
    .filter(([, enabled]) => enabled === true)
    .map(([key]) => normalizeCategoryKey(key))
    .filter(Boolean);
};

const getLatestUserContent = (messages) => {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const latestUserMessage = [...safeMessages]
    .reverse()
    .find(
      (message) =>
        message &&
        message.role === 'user' &&
        typeof message.content === 'string' &&
        message.content.trim().length > 0,
    );

  return latestUserMessage ? latestUserMessage.content : '';
};

const hasAnyCategory = (categories, patterns) =>
  categories.some((category) =>
    patterns.some((pattern) =>
      normalizeCategoryKey(category).includes(normalizeCategoryKey(pattern)),
    ),
  );

const buildSemanticModerationSafety = (moderationResult, options = {}) => {
  const scope = options && options.scope === 'input' ? 'input' : 'output';
  const codePrefix = scope === 'input' ? 'semantic-input' : 'semantic-moderation';
  const routingContext = resolveCrisisRoutingContext(
    options && options.crisisContext ? options.crisisContext : {},
  );
  const flaggedCategories = getFlaggedModerationCategories(
    moderationResult && moderationResult.categories ? moderationResult.categories : {},
  );
  const flagged = moderationResult && moderationResult.flagged === true;

  if (!flagged && flaggedCategories.length === 0) {
    return buildSafetyResult();
  }

  const hasSelfHarmCategory = hasAnyCategory(flaggedCategories, ['self-harm', 'suicide']);
  const hasViolenceCategory = hasAnyCategory(flaggedCategories, ['violence', 'violent']);
  const hasWeaponCategory = hasAnyCategory(flaggedCategories, ['weapon', 'explosive']);
  const hasSexualMinorsCategory = hasAnyCategory(flaggedCategories, [
    'sexual-minors',
    'child sexual',
    'minor',
  ]);
  const hasThreatCategory = hasAnyCategory(flaggedCategories, [
    'threat',
    'hate-threat',
    'harassment-threat',
  ]);

  if (hasSelfHarmCategory) {
    return buildSafetyResult({
      level: 'blocked',
      blocked: true,
      shouldEscalate: true,
      reasonCodes: [`${codePrefix}-self-harm`],
      userFacingMessage:
        scope === 'input'
          ? buildCrisisEscalationMessage(routingContext)
          : buildSelfHarmInstructionBlockMessage(routingContext),
    });
  }

  if (hasViolenceCategory || hasWeaponCategory || hasSexualMinorsCategory || hasThreatCategory) {
    return buildSafetyResult({
      level: 'blocked',
      blocked: true,
      shouldEscalate: false,
      reasonCodes: [`${codePrefix}-unsafe`],
      userFacingMessage:
        scope === 'input'
          ? 'I can’t help with requests that could enable harm. I can support safer alternatives.'
          : 'I can’t continue with content that could enable harm. I can help with safer alternatives.',
    });
  }

  return buildSafetyResult({
    level: 'sensitive',
    blocked: false,
    shouldEscalate: false,
    reasonCodes: [`${codePrefix}-flagged`],
    userFacingMessage:
      scope === 'input'
        ? 'Safety checks adjusted your request before processing.'
        : 'Safety checks adjusted this response to keep things safer.',
  });
};

const selectHigherSafetyLevel = (left, right) =>
  (SAFETY_LEVEL_PRIORITY[right] || 0) > (SAFETY_LEVEL_PRIORITY[left] || 0) ? right : left;

const mergeSafetyResults = (baseSafety, additionalSafety) => {
  const base = buildSafetyResult(baseSafety || {});
  const extra = buildSafetyResult(additionalSafety || {});

  const blocked = base.blocked || extra.blocked;
  const selectedLevel = selectHigherSafetyLevel(base.level, extra.level);
  const level = blocked && selectedLevel !== 'crisis' ? 'blocked' : selectedLevel;

  return buildSafetyResult({
    level,
    blocked,
    shouldEscalate: base.shouldEscalate || extra.shouldEscalate,
    reasonCodes: unique([...(base.reasonCodes || []), ...(extra.reasonCodes || [])]),
    redactedTypes: unique([...(base.redactedTypes || []), ...(extra.redactedTypes || [])]),
    userFacingMessage: extra.userFacingMessage || base.userFacingMessage,
  });
};

const redactSensitiveText = (value) => {
  const redactedTypes = [];
  let sanitized = typeof value === 'string' ? value : '';

  EMAIL_PATTERN.lastIndex = 0;
  if (EMAIL_PATTERN.test(sanitized)) {
    redactedTypes.push('email');
    EMAIL_PATTERN.lastIndex = 0;
    sanitized = sanitized.replace(EMAIL_PATTERN, '[redacted-email]');
  }

  PHONE_PATTERN.lastIndex = 0;
  if (PHONE_PATTERN.test(sanitized)) {
    redactedTypes.push('phone');
    PHONE_PATTERN.lastIndex = 0;
    sanitized = sanitized.replace(PHONE_PATTERN, '[redacted-phone]');
  }

  LONG_DIGIT_PATTERN.lastIndex = 0;
  if (LONG_DIGIT_PATTERN.test(sanitized)) {
    redactedTypes.push('numeric-sequence');
    LONG_DIGIT_PATTERN.lastIndex = 0;
    sanitized = sanitized.replace(LONG_DIGIT_PATTERN, '[redacted-digits]');
  }

  return {
    value: sanitized,
    redactedTypes: unique(redactedTypes),
  };
};

const filterPromptInjectionText = (value) => {
  let sanitized = typeof value === 'string' ? value : '';
  let filtered = false;

  PROMPT_INJECTION_REPLACEMENTS.forEach(({ pattern, replacement }) => {
    pattern.lastIndex = 0;
    if (pattern.test(sanitized)) {
      filtered = true;
      pattern.lastIndex = 0;
      sanitized = sanitized.replace(pattern, replacement);
    }
  });

  return {
    value: sanitized,
    filtered,
  };
};

const assessMessageSafety = (messages, options = {}) => {
  const routingContext = resolveCrisisRoutingContext(
    options && options.crisisContext ? options.crisisContext : {},
  );
  const reasonCodes = [];
  const redactedTypes = [];
  // Scan every user-role message (not only the latest) so crisis language in an
  // earlier turn of the batch is not missed by the server enforcement point.
  const userContents = (Array.isArray(messages) ? messages : [])
    .filter((message) => message && message.role === 'user' && typeof message.content === 'string')
    .map((message) => message.content);
  const hasLatestUserCrisisLanguage = userContents.some((content) => hasCrisisLanguage(content));

  const sanitizedMessages = messages.map((message) => {
    const role = typeof message.role === 'string' ? message.role : '';
    const content = typeof message.content === 'string' ? message.content : '';
    const redaction = redactSensitiveText(content);

    redactedTypes.push(...redaction.redactedTypes);

    if (role !== 'user') {
      return {
        role: message.role,
        content: redaction.value,
      };
    }

    if (PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(content))) {
      reasonCodes.push('prompt-injection');
    }

    const promptInjectionFilter = filterPromptInjectionText(redaction.value);

    return {
      role: message.role,
      content: promptInjectionFilter.value,
    };
  });

  if (hasLatestUserCrisisLanguage) {
    reasonCodes.push('crisis-language');
  }

  const uniqueReasonCodes = unique(reasonCodes);
  const uniqueRedactedTypes = unique(redactedTypes);

  if (uniqueReasonCodes.includes('crisis-language')) {
    return {
      sanitizedMessages,
      safety: buildSafetyResult({
        level: 'crisis',
        blocked: true,
        shouldEscalate: true,
        reasonCodes: uniqueReasonCodes,
        redactedTypes: uniqueRedactedTypes,
        userFacingMessage: buildCrisisEscalationMessage(routingContext),
      }),
    };
  }

  if (uniqueReasonCodes.includes('prompt-injection')) {
    return {
      sanitizedMessages,
      safety: buildSafetyResult({
        level: uniqueRedactedTypes.length > 0 ? 'sensitive' : 'clear',
        blocked: false,
        shouldEscalate: false,
        reasonCodes: uniqueReasonCodes,
        redactedTypes: uniqueRedactedTypes,
        userFacingMessage:
          'Safety filters adjusted this request to keep the conversation focused and safe.',
      }),
    };
  }

  if (uniqueRedactedTypes.length > 0) {
    return {
      sanitizedMessages,
      safety: buildSafetyResult({
        level: 'sensitive',
        blocked: false,
        shouldEscalate: false,
        reasonCodes: ['pii-redacted'],
        redactedTypes: uniqueRedactedTypes,
        userFacingMessage:
          'Sensitive contact details were removed before your request was processed.',
      }),
    };
  }

  return {
    sanitizedMessages,
    safety: buildSafetyResult(),
  };
};

const assessAssistantOutputSafety = (assistantOutput, options = {}) => {
  const routingContext = resolveCrisisRoutingContext(
    options && options.crisisContext ? options.crisisContext : {},
  );
  const content = typeof assistantOutput === 'string' ? assistantOutput : '';

  if (!content.trim()) {
    return {
      safety: buildSafetyResult(),
    };
  }

  // The harmful-instruction patterns always run. Presence of a refusal phrase
  // must never suppress a positive match: blocking a genuine refusal that
  // happens to match and replacing it with the crisis-support message is a safe
  // outcome, whereas letting method detail through is not.
  if (OUTPUT_SELF_HARM_INSTRUCTION_PATTERNS.some((pattern) => pattern.test(content))) {
    return {
      safety: buildSafetyResult({
        level: 'blocked',
        blocked: true,
        shouldEscalate: true,
        reasonCodes: ['unsafe-output-self-harm'],
        userFacingMessage: buildSelfHarmInstructionBlockMessage(routingContext),
      }),
    };
  }

  if (OUTPUT_VIOLENCE_INSTRUCTION_PATTERNS.some((pattern) => pattern.test(content))) {
    return {
      safety: buildSafetyResult({
        level: 'blocked',
        blocked: true,
        shouldEscalate: false,
        reasonCodes: ['unsafe-output-violence'],
        userFacingMessage:
          'I can’t provide instructions for violence or harm. I can help with de-escalation and safer alternatives.',
      }),
    };
  }

  return {
    safety: buildSafetyResult(),
  };
};

const sanitizeModel = (requestedModel) => {
  const allowedModels = getAllowedModels();
  return allowedModels.includes(requestedModel) ? requestedModel : allowedModels[0];
};

const normalizeProxyRequest = (input) => {
  const payload = input && typeof input === 'object' ? input : {};
  const rawMessages = Array.isArray(payload.messages) ? payload.messages : [];
  const maxMessages = getProxyMaxMessages();
  const maxMessageChars = getProxyMaxMessageChars();
  const maxSystemMessageChars = getProxyMaxSystemMessageChars();

  if (rawMessages.length > maxMessages) {
    return {
      error: `Too many messages in a single request. Maximum allowed is ${maxMessages}.`,
    };
  }

  const normalizedMessages = rawMessages
    .map((message) => ({
      role: message && typeof message.role === 'string' ? message.role : '',
      content: message && typeof message.content === 'string' ? message.content : '',
    }))
    .filter(
      (message) =>
        ['system', 'user', 'assistant'].includes(message.role) && message.content.trim().length > 0,
    );

  if (normalizedMessages.length === 0) {
    return {
      error: 'At least one valid message is required.',
    };
  }

  const oversizedMessage = normalizedMessages.find((message) => {
    const maxChars = message.role === 'system' ? maxSystemMessageChars : maxMessageChars;
    return message.content.length > maxChars;
  });

  if (oversizedMessage) {
    const maxChars = oversizedMessage.role === 'system' ? maxSystemMessageChars : maxMessageChars;

    return {
      error: `Message content is too long for role "${oversizedMessage.role}". Maximum allowed is ${maxChars} characters.`,
    };
  }

  return {
    request: {
      model: sanitizeModel(
        typeof payload.model === 'string' ? payload.model : DEFAULT_ALLOWED_MODELS[0],
      ),
      messages: normalizedMessages,
      temperature:
        typeof payload.temperature === 'number' && Number.isFinite(payload.temperature)
          ? Math.max(0, Math.min(payload.temperature, 2))
          : 0.7,
      maxTokens:
        typeof payload.maxTokens === 'number' && Number.isFinite(payload.maxTokens)
          ? Math.max(64, Math.min(Math.round(payload.maxTokens), 1200))
          : 800,
      stream: payload.stream === true,
      safetyIdentifier:
        typeof payload.safetyIdentifier === 'string' && payload.safetyIdentifier.trim().length > 0
          ? payload.safetyIdentifier.trim()
          : undefined,
      safetyLocale:
        typeof payload.safetyLocale === 'string' && payload.safetyLocale.trim().length > 0
          ? payload.safetyLocale.trim().slice(0, 64)
          : undefined,
      safetyCountry:
        typeof payload.safetyCountry === 'string'
          ? normalizeCountryCode(payload.safetyCountry)
          : undefined,
    },
  };
};

module.exports = {
  assessAssistantOutputSafety,
  assessMessageSafety,
  buildSemanticModerationSafety,
  buildSafetyResult,
  getLatestUserContent,
  getFlaggedModerationCategories,
  mergeSafetyResults,
  normalizeProxyRequest,
  redactSensitiveText,
  resolveCrisisRoutingContext,
};
