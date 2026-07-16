/**
 * Firebase Authentication Service
 *
 * Firebase auth wrapper with error handling and type safety.
 */

import { auth } from '@/src/config/firebase.config';
import { logger } from '@/src/shared/utils/debug';
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
  User,
  UserCredential,
  AuthError,
} from 'firebase/auth';

if (!auth) {
  logger.warn('Firebase Auth is not initialized. Please check your Firebase configuration.');
}

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  if (!auth) throw new Error('Firebase Auth not initialized');

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: unknown) {
    // Map Firebase errors to user-friendly messages
    const authError = error as AuthError;
    const errorMessage = getAuthErrorMessage(authError.code);
    logger.error('Sign in failed', error, { email });
    throw new Error(errorMessage);
  }
};

/**
 * Sign up with email and password
 */
export const signUp = async (
  email: string,
  password: string,
  displayName?: string,
): Promise<UserCredential> => {
  if (!auth) throw new Error('Firebase Auth not initialized');

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update user profile with display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }

    return userCredential;
  } catch (error: unknown) {
    const authError = error as AuthError;
    const errorMessage = getAuthErrorMessage(authError.code);
    logger.error('Sign up failed', error, { email });
    throw new Error(errorMessage);
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  if (!auth) throw new Error('Firebase Auth not initialized');

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: unknown) {
    const authError = error as AuthError;
    const errorMessage = getAuthErrorMessage(authError.code);
    logger.error('Password reset failed', error, { email });
    throw new Error(errorMessage);
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): User | null => {
  if (!auth) return null;
  return auth.currentUser;
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  if (!auth) throw new Error('Firebase Auth not initialized');

  try {
    await firebaseSignOut(auth);
  } catch (error: unknown) {
    const authError = error as AuthError;
    const errorMessage = getAuthErrorMessage(authError.code);
    logger.error('Sign out failed', error);
    throw new Error(errorMessage);
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
};

/**
 * Map Firebase error codes to user-friendly messages
 */
const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
  };

  return errorMessages[errorCode] || 'An error occurred. Please try again.';
};

// Export auth instance for direct use if needed
export { auth };
export default {
  signIn,
  signUp,
  sendPasswordReset,
  getCurrentUser,
  signOut,
  onAuthStateChange,
};
