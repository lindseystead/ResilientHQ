/**
 * Error Types
 *
 * Type-safe error definitions for better error handling.
 */

export interface AppError extends Error {
  code?: string;
  context?: string;
  timestamp?: string;
}

export interface FirebaseAuthError extends AppError {
  code:
    | 'auth/email-already-in-use'
    | 'auth/invalid-email'
    | 'auth/weak-password'
    | 'auth/user-not-found'
    | 'auth/wrong-password'
    | 'auth/too-many-requests'
    | 'auth/network-request-failed'
    | 'auth/invalid-credential';
}

export interface FirestoreError extends AppError {
  code: 'firestore/permission-denied' | 'firestore/unavailable' | 'firestore/not-found';
}

export interface NetworkError extends AppError {
  code: 'network/offline' | 'network/timeout' | 'network/failed';
}

export interface OpenAIError extends AppError {
  code: 'openai/api-key-missing' | 'openai/rate-limit' | 'openai/service-unavailable';
}

export type KnownError = FirebaseAuthError | FirestoreError | NetworkError | OpenAIError;

/**
 * Type guard to check if error is a known error type
 */
export function isKnownError(error: unknown): error is KnownError {
  return error instanceof Error && 'code' in error;
}

/**
 * Type guard for Firebase Auth errors
 */
export function isFirebaseAuthError(error: unknown): error is FirebaseAuthError {
  return isKnownError(error) && error.code?.startsWith('auth/') === true;
}

/**
 * Type guard for Firestore errors
 */
export function isFirestoreError(error: unknown): error is FirestoreError {
  return isKnownError(error) && error.code?.startsWith('firestore/') === true;
}

/**
 * Type guard for Network errors
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return isKnownError(error) && error.code?.startsWith('network/') === true;
}

/**
 * Type guard for OpenAI errors
 */
export function isOpenAIError(error: unknown): error is OpenAIError {
  return isKnownError(error) && error.code?.startsWith('openai/') === true;
}
