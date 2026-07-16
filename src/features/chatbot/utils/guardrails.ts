/**
 * Chatbot Guardrails
 *
 * Client-side safety checks for crisis escalation, privacy redaction, and
 * prompt-injection resistance before messages are sent to AI services.
 */

import { EMOTIONAL_KEYWORDS } from '../constants/chatbot';
import { buildLocalizedCrisisSupportMessage } from '@/src/domains/ai/safetyContext';

/**
 * High-recall crisis detection. A false positive (showing a resource to a
 * non-crisis user) is low-harm; a false negative (missing a real crisis) is
 * catastrophic, so this list is intentionally broad.
 *
 * IMPORTANT: keep this list in sync with `CRISIS_PATTERNS` in
 * `server/ai-proxy/safety.js`. Both are covered by tests asserting the same
 * canonical phrases are detected.
 */
const CRISIS_PATTERNS = [
  // Direct self-harm / suicide intent and methods
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
  // Ideation / hopelessness / finality
  /\b(?:better off|be better) (?:dead|off dead|without me)\b/i,
  /\bno reason to (?:live|go on|keep going)\b/i,
  /\bnot worth living\b/i,
  /\bcan'?t (?:go on|do this anymore|keep going|stay safe|take (?:it|this) anymore)\b/i,
  /\bno(?:body| one) (?:would|will) miss me\b/i,
  /\bevery(?:one|body)(?:'?s| is| would be)? better (?:off )?without me\b/i,
  /\b(?:this is|writing) my (?:last|final) (?:message|goodbye|note)\b/i,
  /\b(?:suicide|goodbye) (?:note|letter|forever)\b/i,
  // Explicit terms, plans, and means
  /\bself[-\s]?harm(?:ing)?\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\bsuicide plan\b/i,
  /\b(?:have|got|made) a plan to (?:die|kill|end)\b/i,
  /\bready to (?:die|end (?:it|my life))\b/i,
  /\b(?:overdose|od on|ending it all)\b/i,
  /\b(?:took|taken|swallowed) (?:a bunch of |all (?:my|the) )?(?:pills|meds|medication|drugs)\b/i,
  // Harm to others
  /\b(?:kill|hurt|harm) (?:someone|somebody|others|people|them)\b/i,
  /\bviolent urges\b/i,
  // Spanish (matched after diacritics are stripped)
  /\b(?:quiero morir|quiero matarme|me quiero matar|no quiero vivir|suicid(?:io|arme))\b/i,
  /\bhacerme dano\b/i,
  /\bno puedo (?:mas|seguir)\b/i,
];

const stripDiacritics = (text: string): string =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Normalizes text before crisis matching: lowercase, strip diacritics, and
 * collapse whitespace so patterns are robust to accents and spacing.
 */
export const normalizeForCrisisMatch = (text: string): string =>
  stripDiacritics(text.toLowerCase()).replace(/\s+/g, ' ').trim();

export const hasCrisisLanguage = (text: string): boolean => {
  const normalized = normalizeForCrisisMatch(text);
  return CRISIS_PATTERNS.some((pattern) => pattern.test(normalized));
};

const PROMPT_INJECTION_PATTERNS = [
  /\bignore (?:all |any |the )?(?:previous|prior|earlier) (?:instructions|rules|messages)\b/i,
  /\bignore your (?:instructions|rules|safety)\b/i,
  /\bsystem prompt\b/i,
  /\bjailbreak\b/i,
  /\bdeveloper message\b/i,
];

const PROMPT_INJECTION_REPLACEMENTS = [
  {
    pattern:
      /\bignore (?:all |any |the )?(?:previous|prior|earlier) (?:instructions|rules|messages)\b/gi,
    replacement: '[filtered-instruction]',
  },
  {
    pattern: /\bignore your (?:instructions|rules|safety)\b/gi,
    replacement: '[filtered-instruction]',
  },
  {
    pattern: /\bsystem prompt\b/gi,
    replacement: '[filtered-system-prompt-request]',
  },
  {
    pattern: /\bjailbreak\b/gi,
    replacement: '[filtered-jailbreak-request]',
  },
  {
    pattern: /\bdeveloper message\b/gi,
    replacement: '[filtered-system-prompt-request]',
  },
];

const PII_REPLACEMENTS = [
  {
    label: 'email address',
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: '[redacted email]',
  },
  {
    label: 'phone number',
    pattern: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?){2}\d{4}\b/g,
    replacement: '[redacted phone]',
  },
];

export interface ChatSafetyAssessment {
  sanitizedContent: string;
  hasCrisisSignals: boolean;
  hasPromptInjectionSignals: boolean;
  containsSensitiveData: boolean;
  redactedDataTypes: string[];
}

export const sanitizeChatText = (content: string): ChatSafetyAssessment => {
  const trimmedContent = content.trim();
  let sanitizedContent = trimmedContent;
  const redactedDataTypes: string[] = [];

  PII_REPLACEMENTS.forEach(({ label, pattern, replacement }) => {
    const hasMatch = pattern.test(sanitizedContent);
    pattern.lastIndex = 0;

    if (hasMatch) {
      redactedDataTypes.push(label);
      sanitizedContent = sanitizedContent.replace(pattern, replacement);
    }
  });

  PROMPT_INJECTION_REPLACEMENTS.forEach(({ pattern, replacement }) => {
    pattern.lastIndex = 0;

    if (pattern.test(sanitizedContent)) {
      pattern.lastIndex = 0;
      sanitizedContent = sanitizedContent.replace(pattern, replacement);
    }
  });

  return {
    sanitizedContent,
    hasCrisisSignals: hasCrisisLanguage(trimmedContent),
    hasPromptInjectionSignals: PROMPT_INJECTION_PATTERNS.some((pattern) =>
      pattern.test(trimmedContent),
    ),
    containsSensitiveData: redactedDataTypes.length > 0,
    redactedDataTypes,
  };
};

export const buildGuardrailNotice = (assessment: ChatSafetyAssessment): string | null => {
  if (assessment.hasCrisisSignals) {
    return 'High-risk language detected. Crisis support guidance is being shown instead of a normal AI reply.';
  }

  const notices: string[] = [];

  if (assessment.containsSensitiveData) {
    notices.push(
      `Sensitive details were redacted before sending or saving this message (${assessment.redactedDataTypes.join(', ')}).`,
    );
  }

  if (assessment.hasPromptInjectionSignals) {
    notices.push('Requests to bypass safety instructions are ignored.');
  }

  return notices.length > 0 ? notices.join(' ') : null;
};

export const buildCrisisSupportMessage = (): string => buildLocalizedCrisisSupportMessage();

export const shouldPromptJournal = (
  content: string,
  options?: {
    gentleMode?: boolean;
  },
): boolean => {
  const hasEmotionalLanguage = EMOTIONAL_KEYWORDS.some((keyword) =>
    content.toLowerCase().includes(keyword),
  );

  if (!hasEmotionalLanguage) {
    return false;
  }

  if (options?.gentleMode) {
    return content.trim().length >= 40;
  }

  return true;
};
