/**
 * Sentry Configuration
 *
 * Error tracking and performance monitoring setup.
 * Only initializes in production builds or when explicitly enabled.
 */

// Optional Sentry import - only use if available
import { logger } from '@/src/shared/utils/debug';
import {
  getSentryClient,
  SentryExceptionContext,
  SentryInitOptions,
} from '@/src/services/observability/sentryAdapter';
import { appEnv } from './env';

const Sentry = getSentryClient();

/**
 * Initialize Sentry for error tracking
 *
 * Set EXPO_PUBLIC_SENTRY_DSN in your .env file for production.
 * In development, Sentry will be disabled unless EXPO_PUBLIC_ENABLE_SENTRY=true
 */
export const initSentry = () => {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  const enableInDev = process.env.EXPO_PUBLIC_ENABLE_SENTRY === 'true';
  const isProduction = appEnv.environment === 'production';

  // Only initialize if Sentry is available, DSN is provided and (production or explicitly enabled in dev)
  if (!Sentry || !dsn || (!isProduction && !enableInDev)) {
    return;
  }

  try {
    const initOptions: SentryInitOptions = {
      dsn,
      debug: __DEV__,
      environment: appEnv.environment,
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,
      tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in production, 100% in dev
      // Never let Sentry auto-attach IPs, cookies, or request bodies for a health app.
      sendDefaultPii: false,
      beforeSend(event, hint) {
        // Filter out known non-critical errors
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error) {
            // Ignore network errors that are expected (offline mode or ad blockers)
            if (error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
              return null;
            }
          }
        }

        // Scrub PII: keep only a pseudonymous user id, and drop request payloads
        // that could carry health-related conversation content.
        if (event.user) {
          event.user = { id: event.user.id };
        }
        delete event.request;

        return event;
      },
    };

    Sentry.init(initOptions);
  } catch (error: unknown) {
    // Silently fail in production, log in dev
    logger.error(
      'Failed to initialize Sentry',
      error instanceof Error ? error : new Error(String(error)),
    );
  }
};

/**
 * Set user context for Sentry.
 *
 * Only the pseudonymous Firebase uid is sent — never email or display name — so
 * that error reports cannot be tied back to a person's identity.
 */
export const setSentryUser = (userId: string) => {
  if (Sentry) {
    Sentry.setUser({ id: userId });
  }
};

/**
 * Clear user context (on logout)
 */
export const clearSentryUser = () => {
  if (Sentry) {
    Sentry.setUser(null);
  }
};

/**
 * Capture a message (non-error)
 */
export const captureMessage = (
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
) => {
  if (Sentry) {
    Sentry.captureMessage(message, level);
  }
};

/**
 * Capture an exception
 */
export const captureException = (
  error: Error,
  context?: { context?: string; tags?: Record<string, unknown>; extra?: Record<string, unknown> },
) => {
  if (Sentry) {
    const sentryContext: SentryExceptionContext = {
      tags: context?.tags,
      extra: {
        ...(context?.extra ?? {}),
        ...(context?.context ? { context: context.context } : {}),
      },
    };
    Sentry.captureException(error, {
      ...sentryContext,
    });
  }
};
