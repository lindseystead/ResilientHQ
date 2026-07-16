/**
 * Community Content Moderation
 *
 * Lightweight, deterministic pre-publish moderation for community posts and comments.
 * The goal is to block high-risk content categories before they are written.
 */

import { INPUT_LIMITS } from '@/src/config/constants';

export type CommunityModerationTarget = 'post' | 'comment';

export interface CommunityModerationResult {
  allowed: boolean;
  normalizedContent: string;
  code?: 'VALIDATION_ERROR' | 'CONTENT_TOO_LONG' | 'CONTENT_SAFETY_BLOCKED' | 'CONTENT_PII_BLOCKED';
  userMessage?: string;
}

const CRISIS_PATTERNS = [
  /\b(?:kill myself|killing myself)\b/i,
  /\b(?:want to die|wish I was dead)\b/i,
  /\b(?:end my life|ending my life)\b/i,
  /\b(?:hurt myself|self[-\s]?harm)\b/i,
  /\b(?:suicide|suicidal)\b/i,
];

const THREAT_PATTERNS = [
  /\b(?:go kill yourself)\b/i,
  /\b(?:i(?:'| a)?m going to kill (?:you|them|someone))\b/i,
  /\b(?:i(?:'| a)?m going to hurt (?:you|them|someone))\b/i,
];

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?){2}\d{4}\b/g;
const LONG_DIGIT_PATTERN = /\b\d{9,}\b/g;

const URL_PATTERN = /https?:\/\/[^\s]+/gi;
const MAX_URLS_IN_POST = 2;
const MAX_URLS_IN_COMMENT = 1;

const normalizeCommunityContent = (content: string): string =>
  content
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();

const getMaxLength = (target: CommunityModerationTarget): number =>
  target === 'post' ? INPUT_LIMITS.maxPostLength : INPUT_LIMITS.maxCommentLength;

export const moderateCommunityContent = (
  rawContent: string,
  target: CommunityModerationTarget,
): CommunityModerationResult => {
  const normalizedContent = normalizeCommunityContent(rawContent);

  if (!normalizedContent) {
    return {
      allowed: false,
      normalizedContent,
      code: 'VALIDATION_ERROR',
      userMessage: target === 'post' ? 'Post content cannot be empty' : 'Comment cannot be empty',
    };
  }

  const maxLength = getMaxLength(target);
  if (normalizedContent.length > maxLength) {
    return {
      allowed: false,
      normalizedContent,
      code: 'CONTENT_TOO_LONG',
      userMessage: `This ${target} exceeds the ${maxLength}-character limit.`,
    };
  }

  if (
    CRISIS_PATTERNS.some((pattern) => pattern.test(normalizedContent)) ||
    THREAT_PATTERNS.some((pattern) => pattern.test(normalizedContent))
  ) {
    return {
      allowed: false,
      normalizedContent,
      code: 'CONTENT_SAFETY_BLOCKED',
      userMessage:
        'This content cannot be published. If someone may be in danger, contact local emergency services immediately or find a local crisis hotline.',
    };
  }

  EMAIL_PATTERN.lastIndex = 0;
  PHONE_PATTERN.lastIndex = 0;
  LONG_DIGIT_PATTERN.lastIndex = 0;
  if (
    EMAIL_PATTERN.test(normalizedContent) ||
    PHONE_PATTERN.test(normalizedContent) ||
    LONG_DIGIT_PATTERN.test(normalizedContent)
  ) {
    return {
      allowed: false,
      normalizedContent,
      code: 'CONTENT_PII_BLOCKED',
      userMessage:
        'For safety and privacy, remove personal contact details before posting in community spaces.',
    };
  }

  const urlMatches = normalizedContent.match(URL_PATTERN);
  const maxUrls = target === 'post' ? MAX_URLS_IN_POST : MAX_URLS_IN_COMMENT;
  if ((urlMatches?.length ?? 0) > maxUrls) {
    return {
      allowed: false,
      normalizedContent,
      code: 'CONTENT_SAFETY_BLOCKED',
      userMessage: `This ${target} contains too many links. Please reduce external links and try again.`,
    };
  }

  return {
    allowed: true,
    normalizedContent,
  };
};
