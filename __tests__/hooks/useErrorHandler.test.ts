/**
 * useErrorHandler Hook Tests
 *
 * Comprehensive tests for the error handling hook that normalizes errors
 * from Firebase, OpenAI, network, and generic sources. Tests error reporting
 * to Sentry, analytics tracking, and Alert display behavior.
 */

import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { CommunityError } from '@/src/domains/community/types';
import {
  OFFLINE_QUEUE_SECURE_STORAGE_CODE,
  OfflineQueueSecureStorageError,
} from '@/src/services/offline/errors';
import { useErrorHandler } from '@/src/shared/hooks/useErrorHandler';
import * as sentryConfig from '@/src/config/sentry.config';
import * as analytics from '@/src/shared/utils/analytics';

// Mock dependencies
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}));

jest.mock('@/src/config/sentry.config', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

jest.mock('@/src/shared/utils/analytics', () => ({
  trackError: jest.fn(),
}));

jest.mock('@/src/shared/utils/debug', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Return Value ────────────────────────────────────────────────────────

  describe('hook return value', () => {
    it('should return a function', () => {
      const { result } = renderHook(() => useErrorHandler());
      expect(typeof result.current).toBe('function');
    });

    it('should return the normalized error message', () => {
      const { result } = renderHook(() => useErrorHandler());

      let returned: string | undefined;
      act(() => {
        returned = result.current(new Error('Test error'), { showAlert: false });
      });

      expect(returned).toBeDefined();
      expect(typeof returned).toBe('string');
    });

    it('should return stable reference across renders', () => {
      const { result, rerender } = renderHook(() => useErrorHandler());
      const first = result.current;
      rerender({});
      expect(result.current).toBe(first);
    });
  });

  // ─── Firebase Auth Error Normalization ───────────────────────────────────

  describe('Firebase Auth error normalization', () => {
    it('should normalize auth/email-already-in-use', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('auth/email-already-in-use'), { showAlert: false });
      });
      expect(msg).toBe('This email is already registered. Please sign in instead.');
    });

    it('should normalize auth/invalid-email', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('auth/invalid-email'), { showAlert: false });
      });
      expect(msg).toBe('Please enter a valid email address.');
    });

    it('should normalize auth/weak-password', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('auth/weak-password'), { showAlert: false });
      });
      expect(msg).toBe('Password should be at least 6 characters.');
    });

    it('should normalize auth/user-not-found', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('auth/user-not-found'), { showAlert: false });
      });
      expect(msg).toBe('No account found with this email address.');
    });

    it('should normalize auth/wrong-password', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('auth/wrong-password'), { showAlert: false });
      });
      expect(msg).toBe('Incorrect password. Please try again.');
    });

    it('should normalize auth/too-many-requests', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('auth/too-many-requests'), { showAlert: false });
      });
      expect(msg).toBe('Too many failed attempts. Please try again later.');
    });

    it('should normalize auth/network-request-failed', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('auth/network-request-failed'), { showAlert: false });
      });
      expect(msg).toBe('Network error. Please check your connection.');
    });

    it('should normalize auth/invalid-credential', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('auth/invalid-credential'), { showAlert: false });
      });
      expect(msg).toBe('Invalid email or password. Please try again.');
    });
  });

  // ─── Firebase Firestore Error Normalization ──────────────────────────────

  describe('Firebase Firestore error normalization', () => {
    it('should normalize firestore/permission-denied', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('firestore/permission-denied'), { showAlert: false });
      });
      expect(msg).toBe('You do not have permission to perform this action.');
    });

    it('should normalize firestore/unavailable', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('firestore/unavailable'), { showAlert: false });
      });
      expect(msg).toBe('Service temporarily unavailable. Please try again later.');
    });

    it('should normalize firestore/not-found', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('firestore/not-found'), { showAlert: false });
      });
      expect(msg).toBe('The requested item was not found.');
    });
  });

  describe('offline secure queue errors', () => {
    it('preserves OfflineQueueSecureStorageError message (not generic Firestore text)', () => {
      const { result } = renderHook(() => useErrorHandler());
      const err = new OfflineQueueSecureStorageError('unavailable', 0);
      let msg: string | undefined;
      act(() => {
        msg = result.current(err, { showAlert: false });
      });
      expect(msg).toBe(err.message);
      expect(msg).not.toContain('Service temporarily unavailable');
    });

    it('preserves CommunityError message for OFFLINE_QUEUE_SECURE_STORAGE_CODE', () => {
      const { result } = renderHook(() => useErrorHandler());
      const base = new OfflineQueueSecureStorageError('too_large', 100);
      const err = new CommunityError(base.message, OFFLINE_QUEUE_SECURE_STORAGE_CODE, true);
      let msg: string | undefined;
      act(() => {
        msg = result.current(err, { showAlert: false });
      });
      expect(msg).toBe(base.message);
    });
  });

  // ─── OpenAI Error Normalization ──────────────────────────────────────────

  describe('OpenAI error normalization', () => {
    it('should normalize OpenAI errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('OpenAI request failed'), { showAlert: false });
      });
      expect(msg).toBe('AI service is currently unavailable. Please try again later.');
    });

    it('should normalize API key errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('Invalid API key provided'), { showAlert: false });
      });
      expect(msg).toBe('AI service is currently unavailable. Please try again later.');
    });
  });

  // ─── Network Error Normalization ─────────────────────────────────────────

  describe('network error normalization', () => {
    it('should normalize network errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('network request failed'), { showAlert: false });
      });
      expect(msg).toBe('Network error. Please check your connection and try again.');
    });

    it('should normalize fetch errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('fetch failed'), { showAlert: false });
      });
      expect(msg).toBe('Network error. Please check your connection and try again.');
    });
  });

  // ─── Generic Error Handling ──────────────────────────────────────────────

  describe('generic error handling', () => {
    it('should pass through unknown Error messages', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error('Some specific error'), { showAlert: false });
      });
      expect(msg).toBe('Some specific error');
    });

    it('should handle Error with empty message', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(new Error(''), { showAlert: false });
      });
      expect(msg).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle string errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current('String error message', { showAlert: false });
      });
      expect(msg).toBe('String error message');
    });

    it('should handle null errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(null, { showAlert: false });
      });
      expect(msg).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle undefined errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(undefined, { showAlert: false });
      });
      expect(msg).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle number errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current(42, { showAlert: false });
      });
      expect(msg).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle object errors (not Error instances)', () => {
      const { result } = renderHook(() => useErrorHandler());
      let msg: string | undefined;
      act(() => {
        msg = result.current({ code: 'ERR', detail: 'something' }, { showAlert: false });
      });
      expect(msg).toBe('An unexpected error occurred. Please try again.');
    });
  });

  // ─── Alert Behavior ─────────────────────────────────────────────────────

  describe('Alert behavior', () => {
    it('should show alert by default', () => {
      const { result } = renderHook(() => useErrorHandler());
      act(() => {
        result.current(new Error('Test error'));
      });
      expect(Alert.alert).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Test error', [{ text: 'OK' }]);
    });

    it('should not show alert when showAlert is false', () => {
      const { result } = renderHook(() => useErrorHandler());
      act(() => {
        result.current(new Error('Test error'), { showAlert: false });
      });
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('should use custom alert title', () => {
      const { result } = renderHook(() => useErrorHandler());
      act(() => {
        result.current(new Error('Test error'), { alertTitle: 'Oops!' });
      });
      expect(Alert.alert).toHaveBeenCalledWith('Oops!', 'Test error', [{ text: 'OK' }]);
    });

    it('should use custom user message in alert', () => {
      const { result } = renderHook(() => useErrorHandler());
      act(() => {
        result.current(new Error('internal error'), { userMessage: 'Something went wrong' });
      });
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Something went wrong', [{ text: 'OK' }]);
    });

    it('should prefer userMessage over normalized message', () => {
      const { result } = renderHook(() => useErrorHandler());
      act(() => {
        result.current(new Error('auth/user-not-found'), {
          userMessage: 'Custom message',
        });
      });
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Custom message', [{ text: 'OK' }]);
    });
  });

  // ─── Sentry Reporting ───────────────────────────────────────────────────

  describe('Sentry reporting', () => {
    it('should call captureException for Error instances', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Test error');
      act(() => {
        result.current(error, { showAlert: false });
      });
      expect(sentryConfig.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          context: 'Unknown',
        }),
      );
    });

    it('should pass context to captureException', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Test');
      act(() => {
        result.current(error, { context: 'Login attempt', showAlert: false });
      });
      expect(sentryConfig.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          context: 'Login attempt',
        }),
      );
    });

    it('should call captureMessage for non-Error values', () => {
      const { result } = renderHook(() => useErrorHandler());
      act(() => {
        result.current('String error', { showAlert: false });
      });
      expect(sentryConfig.captureMessage).toHaveBeenCalledWith('String error', 'error');
    });

    it('should not call captureMessage for Error instances', () => {
      const { result } = renderHook(() => useErrorHandler());
      act(() => {
        result.current(new Error('Test'), { showAlert: false });
      });
      expect(sentryConfig.captureMessage).not.toHaveBeenCalled();
    });

    it('should not call captureException for non-Error values', () => {
      const { result } = renderHook(() => useErrorHandler());
      act(() => {
        result.current('String error', { showAlert: false });
      });
      expect(sentryConfig.captureException).not.toHaveBeenCalled();
    });
  });

  // ─── Analytics Tracking ─────────────────────────────────────────────────

  describe('analytics tracking', () => {
    it('should call trackError for Error instances', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Test');
      act(() => {
        result.current(error, { context: 'Profile update', showAlert: false });
      });
      expect(analytics.trackError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          action: 'Profile update',
        }),
      );
    });

    it('should not call trackError for non-Error values', () => {
      const { result } = renderHook(() => useErrorHandler());
      act(() => {
        result.current('string error', { showAlert: false });
      });
      expect(analytics.trackError).not.toHaveBeenCalled();
    });

    it('should use "Unknown" as default action in analytics', () => {
      const { result } = renderHook(() => useErrorHandler());
      act(() => {
        result.current(new Error('Test'), { showAlert: false });
      });
      expect(analytics.trackError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          action: 'Unknown',
        }),
      );
    });
  });

  // ─── Options Defaults ───────────────────────────────────────────────────

  describe('options defaults', () => {
    it('should default showAlert to true', () => {
      const { result } = renderHook(() => useErrorHandler());
      act(() => {
        result.current(new Error('Test'));
      });
      expect(Alert.alert).toHaveBeenCalled();
    });

    it('should default alertTitle to "Error"', () => {
      const { result } = renderHook(() => useErrorHandler());
      act(() => {
        result.current(new Error('Test'));
      });
      expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String), expect.any(Array));
    });

    it('should default context to "Unknown"', () => {
      const { result } = renderHook(() => useErrorHandler());
      act(() => {
        result.current(new Error('Test'), { showAlert: false });
      });
      expect(sentryConfig.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          context: 'Unknown',
        }),
      );
    });

    it('should work with empty options object', () => {
      const { result } = renderHook(() => useErrorHandler());
      act(() => {
        result.current(new Error('Test'), {});
      });
      expect(Alert.alert).toHaveBeenCalled();
    });

    it('should work with no options argument', () => {
      const { result } = renderHook(() => useErrorHandler());
      act(() => {
        result.current(new Error('Test'));
      });
      expect(Alert.alert).toHaveBeenCalled();
      expect(sentryConfig.captureException).toHaveBeenCalled();
    });
  });
});
