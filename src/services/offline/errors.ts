/**
 * Offline Sync Error Helpers
 *
 * Detects transient connectivity failures that are safe to queue for retry.
 */

const RETRYABLE_CODES = new Set([
  'aborted',
  'cancelled',
  'deadline-exceeded',
  'resource-exhausted',
  'unavailable',
  'firestore/unavailable',
  'network-request-failed',
  'auth/network-request-failed',
]);

const RETRYABLE_MESSAGE_PATTERNS = [
  /network/i,
  /offline/i,
  /timed?\s*out/i,
  /timeout/i,
  /failed to fetch/i,
  /service unavailable/i,
  /firestore\/unavailable/i,
];

const getErrorCode = (error: unknown): string | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const candidate = (error as { code?: unknown }).code;
  return typeof candidate === 'string' ? candidate.toLowerCase() : null;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '';
};

export const isRetryableOfflineError = (error: unknown): boolean => {
  const code = getErrorCode(error);
  if (code && RETRYABLE_CODES.has(code)) {
    return true;
  }

  const message = getErrorMessage(error);
  return RETRYABLE_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
};

export type OfflineQueueSecureStorageReason = 'unavailable' | 'too_large' | 'write_failed';

/** Use with `CommunityError` when mapping secure-queue failures in community domain APIs. */
export const OFFLINE_QUEUE_SECURE_STORAGE_CODE = 'OFFLINE_QUEUE_SECURE_STORAGE' as const;

const secureQueueUserMessage = (reason: OfflineQueueSecureStorageReason): string => {
  switch (reason) {
    case 'unavailable':
      return "We couldn't save a private copy on this device while you're offline. Reconnect to save, or try again when you're back online.";
    case 'too_large':
      return 'This is too large to hold securely on the device while offline. Reconnect to save, or try a shorter note.';
    case 'write_failed':
      return "We couldn't save this securely for later while offline. Reconnect and try again.";
  }
};

export interface OfflineQueueSecureStorageOptions {
  /** Original Firestore/network error that triggered the offline enqueue attempt */
  cause?: unknown;
}

/**
 * Thrown when an offline queue item cannot be stored in SecureStore (no insecure fallback).
 */
export class OfflineQueueSecureStorageError extends Error {
  public readonly reason: OfflineQueueSecureStorageReason;
  public readonly payloadByteLength: number;

  constructor(
    reason: OfflineQueueSecureStorageReason,
    payloadByteLength: number,
    options?: OfflineQueueSecureStorageOptions,
  ) {
    super(secureQueueUserMessage(reason));
    this.name = 'OfflineQueueSecureStorageError';
    this.reason = reason;
    this.payloadByteLength = payloadByteLength;

    Object.setPrototypeOf(this, OfflineQueueSecureStorageError.prototype);

    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export const isOfflineQueueSecureStorageError = (
  error: unknown,
): error is OfflineQueueSecureStorageError => error instanceof OfflineQueueSecureStorageError;

/**
 * If enqueue failed because SecureStore rejected the payload, return a new error with
 * `cause` set to the original Firestore/network failure (for logs and Sentry).
 */
export const wrapOfflineQueueSecureStorageFailure = (
  queueError: unknown,
  originalError: unknown,
): OfflineQueueSecureStorageError | null => {
  if (!isOfflineQueueSecureStorageError(queueError)) {
    return null;
  }

  return new OfflineQueueSecureStorageError(queueError.reason, queueError.payloadByteLength, {
    cause: originalError,
  });
};
