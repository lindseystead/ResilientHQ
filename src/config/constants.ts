/**
 * Universal App Constants
 *
 * Centralized constants used throughout the application.
 * Includes input limits, pagination, animations, date formats, moods,
 * app metadata, feature flags, accessibility settings, and error messages.
 */

const parseBooleanEnvFlag = (value: string | undefined, defaultValue: boolean): boolean => {
  if (typeof value !== 'string') {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) {
    return defaultValue;
  }

  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
};

const aiFeaturesEnabled = parseBooleanEnvFlag(process.env.EXPO_PUBLIC_AI_FEATURES_ENABLED, false);
const aiChatEnabled = parseBooleanEnvFlag(
  process.env.EXPO_PUBLIC_CHATBOT_ENABLED,
  aiFeaturesEnabled,
);
const aiJournalAssistEnabled = parseBooleanEnvFlag(
  process.env.EXPO_PUBLIC_JOURNAL_AI_ASSIST_ENABLED,
  aiFeaturesEnabled,
);
const aiCommunityAssistEnabled = parseBooleanEnvFlag(
  process.env.EXPO_PUBLIC_COMMUNITY_AI_ASSIST_ENABLED,
  aiFeaturesEnabled,
);
const aiProfileBioEnabled = parseBooleanEnvFlag(
  process.env.EXPO_PUBLIC_PROFILE_AI_BIO_ENABLED,
  aiFeaturesEnabled,
);
const aiMoodSuggestionsEnabled = parseBooleanEnvFlag(
  process.env.EXPO_PUBLIC_AI_MOOD_SUGGESTIONS_ENABLED,
  aiFeaturesEnabled,
);

// ===============================
// INPUT LIMITS
// ===============================
export const INPUT_LIMITS = {
  maxChatMessageLength: 500,
  maxJournalEntryLength: 5000,
  maxPostLength: 1000,
  maxCommentLength: 500,
  minPasswordLength: 6,
  minNameLength: 2,
} as const;

// ===============================
// PAGINATION
// ===============================
export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 50,
  postsLimit: 50,
  commentsLimit: 100,
  journalEntriesLimit: 100,
  moodLogsLimit: 30,
} as const;

// ===============================
// ANIMATION CONSTANTS
// ===============================
export const ANIMATION = {
  fadeInDuration: 350,
  splashScreenDuration: 3500,
  springDamping: 15,
  springStiffness: 150,
  longPressDelay: 250,
} as const;

// ===============================
// DATE & TIME FORMATS
// ===============================
export const DATE_FORMATS = {
  displayDate: 'MMMM d, yyyy',
  displayTime: 'h:mm a',
  isoDate: 'yyyy-MM-dd',
  monthYear: 'MMMM yyyy',
} as const;

// ===============================
// MOOD DEFINITIONS
// ===============================
export const MOOD = {
  minValue: 0,
  maxValue: 4,
  emojis: ['😢', '😐', '😊', '😁', '😍'],
  labels: ['Very Low', 'Low', 'Neutral', 'Good', 'Great'],
  colors: ['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#74c0fc'],
} as const;

// ===============================
// ACCESSIBILITY
// ===============================
export const ACCESSIBILITY = {
  minTouchSize: 44,
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
  allowDynamicFontScaling: true,
} as const;

// ===============================
// AI / FEATURE FLAGS
// ===============================
export const FEATURES = {
  aiFeaturesEnabled,
  aiChatEnabled,
  aiJournalAnalysisEnabled: aiJournalAssistEnabled,
  aiMoodSuggestionsEnabled,
  aiCommunityAssistEnabled,
  aiProfileBioEnabled,
  offlineModeEnabled: true,
  enableModeration: true,
} as const;

// ===============================
// COMMUNITY SETTINGS
// ===============================
export const COMMUNITY = {
  maxFlagReportsBeforeHide: 3,
  maxDailyPosts: 8,
  maxDailyComments: 20,
  requireAccountAgeDays: 1,
} as const;

// ===============================
// API RATE LIMITS (client-side)
// ===============================
export const RATE_LIMITS = {
  maxAIRequestsPerMinute: 20,
  maxJournalSavesPerMinute: 10,
} as const;

// ===============================
// DEFAULTS & METADATA
// ===============================
export const APP = {
  name: 'ResilientHQ',
  version: '1.0.0',
  defaultAvatar: '',
  supportEmail: 'support@resilienthq.com',
} as const;

// ===============================
// USER-FACING ERROR MESSAGES
// ===============================
export const ERRORS = {
  network: 'Network error. Please check your connection.',
  unknown: 'Something went wrong. Please try again.',
  missingFields: 'Please fill out all required fields.',
  authentication: 'You must be signed in to perform this action.',
  aiUnavailable: 'AI services are unavailable right now. Try again shortly.',
} as const;
