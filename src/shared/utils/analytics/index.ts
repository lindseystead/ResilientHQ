/**
 * Analytics Service
 *
 * Centralized analytics tracking using Firebase Analytics.
 * Provides type-safe event tracking and user property management.
 *
 * Note: expo-firebase-analytics is deprecated. This service provides
 * a graceful fallback that works without native analytics modules.
 * Analytics will be no-op if Firebase Analytics is not available.
 */

import { appEnv } from '@/src/config/env';
import { logger } from '@/src/shared/utils/debug';
import type { Analytics as FirebaseAnalytics } from 'firebase/analytics';

// Analytics state - will be initialized if available
let Analytics: FirebaseAnalytics | null = null;
let isAnalyticsAvailable = false;

// Event names (type-safe)
export const AnalyticsEvents = {
  // Authentication
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_STARTED: 'login_started',
  LOGIN_COMPLETED: 'login_completed',
  LOGOUT: 'logout',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',

  // Journal
  JOURNAL_ENTRY_CREATED: 'journal_entry_created',
  JOURNAL_ENTRY_UPDATED: 'journal_entry_updated',
  JOURNAL_ENTRY_DELETED: 'journal_entry_deleted',
  JOURNAL_PROMPT_SELECTED: 'journal_prompt_selected',

  // Mood Tracking
  MOOD_LOGGED: 'mood_logged',
  MOOD_VIEWED: 'mood_viewed',
  MOOD_TRACKER_OPENED: 'mood_tracker_opened',

  // Chatbot
  CHATBOT_OPENED: 'chatbot_opened',
  CHATBOT_MESSAGE_SENT: 'chatbot_message_sent',
  CHATBOT_SUGGESTION_CLICKED: 'chatbot_suggestion_clicked',
  CHATBOT_JOURNAL_SUGGESTED: 'chatbot_journal_suggested',

  // Community
  POST_CREATED: 'post_created',
  POST_LIKED: 'post_liked',
  COMMENT_CREATED: 'comment_created',
  RESOURCE_VIEWED: 'resource_viewed',
  EVENT_VIEWED: 'event_viewed',

  // Settings
  SETTINGS_OPENED: 'settings_opened',
  THEME_CHANGED: 'theme_changed',
  NOTIFICATIONS_TOGGLED: 'notifications_toggled',
  BIOMETRIC_ENABLED: 'biometric_enabled',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

type AnalyticsEventParams = Record<string, string | number | boolean>;

type LogEventCompat = (
  analytics: FirebaseAnalytics,
  eventName: string,
  eventParams?: Record<string, unknown>,
) => Promise<void> | void;

// User properties
export const UserProperties = {
  SUBSCRIPTION_STATUS: 'subscription_status',
  ACCOUNT_CREATED_DATE: 'account_created_date',
  TOTAL_JOURNAL_ENTRIES: 'total_journal_entries',
  TOTAL_MOOD_LOGS: 'total_mood_logs',
} as const;

/**
 * Initialize analytics (called once at app startup)
 *
 * Note: expo-firebase-analytics is deprecated. This provides
 * a no-op implementation that can be extended with a different
 * analytics solution if needed.
 */
export const initAnalytics = async () => {
  if (__DEV__ && appEnv.environment !== 'production') {
    // Disable analytics in development unless explicitly enabled
    if (process.env.EXPO_PUBLIC_ENABLE_ANALYTICS !== 'true') {
      logger.debug('Analytics disabled in development');
      isAnalyticsAvailable = false;
      return;
    }
  }

  // Try to initialize Firebase Analytics for web (if available)
  try {
    // Only works on web platform
    if (typeof window !== 'undefined') {
      const { getAnalytics } = await import('firebase/analytics');
      const { app } = await import('@/src/config/firebase.config');

      if (app && getAnalytics) {
        Analytics = getAnalytics(app);
        isAnalyticsAvailable = true;

        logger.info('Analytics initialized (web)');
        return;
      }
    }
  } catch {
    // Analytics not available - this is expected on native platforms
    logger.debug('Analytics not available (native platforms require alternative solution)');
  }

  isAnalyticsAvailable = false;
};

const emitAnalyticsEvent = async (eventName: string, eventParams?: Record<string, unknown>) => {
  if (!Analytics) return;
  const { logEvent } = await import('firebase/analytics');
  const logEventCompat = logEvent as unknown as LogEventCompat;
  await logEventCompat(Analytics, eventName, eventParams);
};

/**
 * Track a screen view
 */
export const trackScreenView = async (screenName: string, screenClass?: string) => {
  if (!isAnalyticsAvailable || !Analytics) return;

  try {
    await emitAnalyticsEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  } catch {
    // Silently fail - analytics is optional
    logger.debug(`Analytics screen view skipped: ${screenName}`);
  }
};

/**
 * Track an event with optional parameters
 * Safely handles undefined/null parameters to prevent Firebase errors
 */
export const trackEvent = async (
  eventName: AnalyticsEventName,
  parameters?: AnalyticsEventParams,
) => {
  if (!isAnalyticsAvailable || !Analytics) return;

  try {
    // Ensure parameters is always an object, never undefined or null
    const safeParameters = parameters && typeof parameters === 'object' ? parameters : {};
    await emitAnalyticsEvent(eventName, safeParameters);
  } catch {
    // Silently fail - analytics is optional
    logger.debug(`Analytics event skipped: ${eventName}`);
  }
};

/**
 * Set user property
 */
export const setUserProperty = async (property: string, value: string | number | boolean) => {
  if (!isAnalyticsAvailable || !Analytics) return;

  try {
    const { setUserProperties } = await import('firebase/analytics');
    await setUserProperties(Analytics, { [property]: String(value) });
  } catch {
    // Silently fail - analytics is optional
    logger.debug(`Analytics setUserProperty skipped: ${property}`);
  }
};

/**
 * Set user ID
 * Gracefully handles null/undefined values to prevent errors
 */
export const setUserId = async (userId: string | null | undefined) => {
  if (!isAnalyticsAvailable || !Analytics) return;
  if (!userId) return; // Ignore null/undefined values

  try {
    const { setUserId: firebaseSetUserId } = await import('firebase/analytics');
    await firebaseSetUserId(Analytics, userId);
  } catch {
    // Silently fail - analytics is optional
    logger.debug('Analytics setUserId skipped');
  }
};

/**
 * Clear user data (on logout)
 */
export const clearUserData = async () => {
  if (!isAnalyticsAvailable || !Analytics) {
    return;
  }

  try {
    const { setUserId } = await import('firebase/analytics');
    // Set user ID to null to clear it
    await setUserId(Analytics, null);
  } catch {
    // Silently fail - analytics is optional
    logger.debug('Analytics clearUserData skipped');
  }
};

/**
 * Track error with context
 */
export const trackError = async (
  error: Error,
  context?: {
    screen?: string;
    action?: string;
    [key: string]: string | number | boolean | undefined;
  },
) => {
  // Safely build parameters object, filtering out undefined values
  const parameters: AnalyticsEventParams = {
    error_message: error.message || 'Unknown error',
    error_name: error.name || 'Error',
  };

  // Add context properties, filtering out undefined
  if (context) {
    Object.keys(context).forEach((key) => {
      const value = context[key];
      if (value !== undefined) {
        parameters[key] = value as string | number | boolean;
      }
    });
  }

  await trackEvent(AnalyticsEvents.ERROR_OCCURRED, parameters);
};
