/**
 * Global Error Handler Hook
 *
 * Provides consistent error handling across the entire app.
 * Normalizes errors from Firebase, OpenAI, network, and JavaScript errors.
 * Displays user-friendly error messages via Alert or in-app toast.
 */

import { captureException, captureMessage } from '@/src/config/sentry.config';
import {
  isOfflineQueueSecureStorageError,
  OFFLINE_QUEUE_SECURE_STORAGE_CODE,
} from '@/src/services/offline/errors';
import type { AppError } from '@/src/types/errors';
import { trackError } from '@/src/shared/utils/analytics';
import { logger } from '@/src/shared/utils/debug';
import { useCallback } from 'react';
import { Alert, Platform } from 'react-native';

export interface ErrorHandlerOptions {
  /**
   * Custom context message to include in error logs
   */
  context?: string;

  /**
   * Custom error message to show to user (overrides normalized message)
   */
  userMessage?: string;

  /**
   * Whether to show an alert (default: true)
   */
  showAlert?: boolean;

  /**
   * Custom alert title (default: "Error")
   */
  alertTitle?: string;
}

/**
 * Normalize error to user-friendly message
 */
const normalizeError = (error: unknown): string => {
  if (isOfflineQueueSecureStorageError(error)) {
    return error.message;
  }

  if (
    error instanceof Error &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string' &&
    (error as { code: string }).code === OFFLINE_QUEUE_SECURE_STORAGE_CODE
  ) {
    return error.message;
  }

  if (error instanceof Error) {
    const message = error.message;

    // Firebase Auth errors
    if (message.includes('auth/')) {
      if (message.includes('email-already-in-use')) {
        return 'This email is already registered. Please sign in instead.';
      }
      if (message.includes('invalid-email')) {
        return 'Please enter a valid email address.';
      }
      if (message.includes('weak-password')) {
        return 'Password should be at least 6 characters.';
      }
      if (message.includes('user-not-found')) {
        return 'No account found with this email address.';
      }
      if (message.includes('wrong-password')) {
        return 'Incorrect password. Please try again.';
      }
      if (message.includes('too-many-requests')) {
        return 'Too many failed attempts. Please try again later.';
      }
      if (message.includes('network-request-failed')) {
        return 'Network error. Please check your connection.';
      }
      if (message.includes('invalid-credential')) {
        return 'Invalid email or password. Please try again.';
      }
    }

    // Firebase Firestore errors
    if (message.includes('firestore/')) {
      if (message.includes('permission-denied')) {
        return 'You do not have permission to perform this action.';
      }
      if (message.includes('unavailable')) {
        return 'Service temporarily unavailable. Please try again later.';
      }
      if (message.includes('not-found')) {
        return 'The requested item was not found.';
      }
    }

    // OpenAI errors
    if (message.includes('OpenAI') || message.includes('API key')) {
      return 'AI service is currently unavailable. Please try again later.';
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }

    // Generic error message
    return message || 'An unexpected error occurred. Please try again.';
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * useErrorHandler Hook
 *
 * Provides a consistent error handling function that:
 * - Normalizes errors from various sources
 * - Logs errors with full metadata
 * - Displays user-friendly error messages
 *
 * @example
 * ```tsx
 * const handleError = useErrorHandler();
 *
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   handleError(error, { context: 'Login attempt' });
 * }
 * ```
 */
export const useErrorHandler = () => {
  const handleError = useCallback((error: unknown, options: ErrorHandlerOptions = {}) => {
    const { context, userMessage, showAlert = true, alertTitle = 'Error' } = options;

    // Normalize error message
    const normalizedMessage = userMessage || normalizeError(error);

    // Log error with full metadata
    const errorLog = {
      message: normalizedMessage,
      originalError: error,
      context: context || 'Unknown',
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    };

    logger.error('Error Handler', errorLog.originalError, {
      message: errorLog.message,
      context: errorLog.context,
      platform: errorLog.platform,
    });

    // Report to Sentry
    if (error instanceof Error) {
      const appError = error as AppError;
      captureException(appError, {
        context: context || 'Unknown',
        tags: {
          errorCode: appError.code || 'unknown',
        },
      });
    } else {
      captureMessage(normalizedMessage, 'error');
    }

    // Track in analytics
    if (error instanceof Error) {
      const appError = error as AppError;
      trackError(appError, {
        action: context || 'Unknown',
        errorCode: appError.code || 'unknown',
      });
    }

    // Show alert if enabled
    if (showAlert) {
      Alert.alert(alertTitle, normalizedMessage, [{ text: 'OK' }]);
    }

    return normalizedMessage;
  }, []);

  return handleError;
};
