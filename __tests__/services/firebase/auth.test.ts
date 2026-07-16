/**
 * Firebase Auth Service Tests
 *
 * Comprehensive tests for the Firebase authentication service wrapper.
 * Tests signIn, signUp, signOut, sendPasswordReset, getCurrentUser,
 * and onAuthStateChange with mocked Firebase dependencies.
 */

import {
  signIn,
  signUp,
  signOut,
  sendPasswordReset,
  getCurrentUser,
  onAuthStateChange,
} from '@/src/services/firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';

// Mock Firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  updateProfile: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/src/config/firebase.config', () => ({
  auth: {
    currentUser: { uid: 'current-uid', email: 'current@example.com' },
  },
}));

jest.mock('@/src/shared/utils/debug', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Firebase Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── signIn ────────────────────────────────────────────────────────────

  describe('signIn', () => {
    it('should sign in with email and password and return user credential', async () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      const mockCredential = { user: mockUser };
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockCredential);

      const result = await signIn('test@example.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123',
      );
    });

    it('should throw user-friendly error for auth/invalid-credential', async () => {
      const firebaseError = { code: 'auth/invalid-credential', message: 'Firebase error' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signIn('test@example.com', 'wrong')).rejects.toThrow(
        'Invalid email or password. Please try again.',
      );
    });

    it('should throw user-friendly error for auth/user-not-found', async () => {
      const firebaseError = { code: 'auth/user-not-found', message: 'Firebase error' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signIn('noone@example.com', 'password')).rejects.toThrow(
        'No account found with this email address.',
      );
    });

    it('should throw user-friendly error for auth/wrong-password', async () => {
      const firebaseError = { code: 'auth/wrong-password', message: 'Firebase error' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signIn('test@example.com', 'wrong')).rejects.toThrow(
        'Incorrect password. Please try again.',
      );
    });

    it('should throw user-friendly error for auth/too-many-requests', async () => {
      const firebaseError = { code: 'auth/too-many-requests', message: 'Firebase error' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signIn('test@example.com', 'password')).rejects.toThrow(
        'Too many failed attempts. Please try again later.',
      );
    });

    it('should throw user-friendly error for auth/network-request-failed', async () => {
      const firebaseError = { code: 'auth/network-request-failed', message: 'Firebase error' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signIn('test@example.com', 'password')).rejects.toThrow(
        'Network error. Please check your connection.',
      );
    });

    it('should throw generic error for unknown error code', async () => {
      const firebaseError = { code: 'auth/unknown-error', message: 'Firebase error' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signIn('test@example.com', 'password')).rejects.toThrow(
        'An error occurred. Please try again.',
      );
    });

    it('should throw user-friendly error for auth/user-disabled', async () => {
      const firebaseError = { code: 'auth/user-disabled', message: 'Firebase error' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signIn('test@example.com', 'password')).rejects.toThrow(
        'This account has been disabled.',
      );
    });
  });

  // ─── signUp ────────────────────────────────────────────────────────────

  describe('signUp', () => {
    it('should create new user and return credential', async () => {
      const mockUser = { uid: 'new-uid', email: 'new@example.com' };
      const mockCredential = { user: mockUser };
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockCredential);

      const result = await signUp('new@example.com', 'Password123!');

      expect(result.user).toEqual(mockUser);
      expect(createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'new@example.com',
        'Password123!',
      );
    });

    it('should update profile with display name when provided', async () => {
      const mockUser = { uid: 'new-uid', email: 'new@example.com' };
      const mockCredential = { user: mockUser };
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockCredential);

      await signUp('new@example.com', 'Password123!', 'John Doe');

      expect(updateProfile).toHaveBeenCalledTimes(1);
      expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'John Doe' });
    });

    it('should not update profile when displayName is not provided', async () => {
      const mockUser = { uid: 'new-uid', email: 'new@example.com' };
      const mockCredential = { user: mockUser };
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockCredential);

      await signUp('new@example.com', 'Password123!');

      expect(updateProfile).not.toHaveBeenCalled();
    });

    it('should not update profile when displayName is empty string', async () => {
      const mockUser = { uid: 'new-uid', email: 'new@example.com' };
      const mockCredential = { user: mockUser };
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockCredential);

      await signUp('new@example.com', 'Password123!', '');

      expect(updateProfile).not.toHaveBeenCalled();
    });

    it('should throw user-friendly error for auth/email-already-in-use', async () => {
      const firebaseError = { code: 'auth/email-already-in-use', message: 'Firebase error' };
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signUp('existing@example.com', 'Password123!')).rejects.toThrow(
        'This email is already registered. Please sign in instead.',
      );
    });

    it('should throw user-friendly error for auth/weak-password', async () => {
      const firebaseError = { code: 'auth/weak-password', message: 'Firebase error' };
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signUp('new@example.com', 'weak')).rejects.toThrow(
        'Password should be at least 6 characters.',
      );
    });

    it('should throw user-friendly error for auth/invalid-email', async () => {
      const firebaseError = { code: 'auth/invalid-email', message: 'Firebase error' };
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signUp('bad-email', 'Password123!')).rejects.toThrow(
        'Please enter a valid email address.',
      );
    });

    it('should throw user-friendly error for auth/operation-not-allowed', async () => {
      const firebaseError = { code: 'auth/operation-not-allowed', message: 'Firebase error' };
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signUp('test@example.com', 'Password123!')).rejects.toThrow(
        'This sign-in method is not enabled.',
      );
    });

    it('should throw generic error for unknown error codes', async () => {
      const firebaseError = { code: 'auth/unknown-error', message: 'Firebase error' };
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signUp('test@example.com', 'Password123!')).rejects.toThrow(
        'An error occurred. Please try again.',
      );
    });
  });

  // ─── signOut ───────────────────────────────────────────────────────────

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      (firebaseSignOut as jest.Mock).mockResolvedValue(undefined);

      await expect(signOut()).resolves.not.toThrow();
      expect(firebaseSignOut).toHaveBeenCalledTimes(1);
    });

    it('should throw user-friendly error on sign out failure', async () => {
      const firebaseError = { code: 'auth/network-request-failed', message: 'Firebase error' };
      (firebaseSignOut as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signOut()).rejects.toThrow('Network error. Please check your connection.');
    });

    it('should throw generic error for unknown sign out failure', async () => {
      const firebaseError = { code: 'auth/internal-error', message: 'Firebase error' };
      (firebaseSignOut as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signOut()).rejects.toThrow('An error occurred. Please try again.');
    });
  });

  // ─── sendPasswordReset ─────────────────────────────────────────────────

  describe('sendPasswordReset', () => {
    it('should send password reset email successfully', async () => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      await expect(sendPasswordReset('test@example.com')).resolves.not.toThrow();
      expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'test@example.com');
    });

    it('should throw user-friendly error for auth/user-not-found', async () => {
      const firebaseError = { code: 'auth/user-not-found', message: 'Firebase error' };
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(firebaseError);

      await expect(sendPasswordReset('noone@example.com')).rejects.toThrow(
        'No account found with this email address.',
      );
    });

    it('should throw user-friendly error for auth/invalid-email', async () => {
      const firebaseError = { code: 'auth/invalid-email', message: 'Firebase error' };
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(firebaseError);

      await expect(sendPasswordReset('bad-email')).rejects.toThrow(
        'Please enter a valid email address.',
      );
    });

    it('should throw user-friendly error for auth/too-many-requests', async () => {
      const firebaseError = { code: 'auth/too-many-requests', message: 'Firebase error' };
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(firebaseError);

      await expect(sendPasswordReset('test@example.com')).rejects.toThrow(
        'Too many failed attempts. Please try again later.',
      );
    });

    it('should throw generic error for unknown error codes', async () => {
      const firebaseError = { code: 'auth/internal-error', message: 'Firebase error' };
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(firebaseError);

      await expect(sendPasswordReset('test@example.com')).rejects.toThrow(
        'An error occurred. Please try again.',
      );
    });
  });

  // ─── getCurrentUser ────────────────────────────────────────────────────

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', () => {
      const user = getCurrentUser();
      expect(user).toBeDefined();
      expect(user?.uid).toBe('current-uid');
      expect(user?.email).toBe('current@example.com');
    });
  });

  // ─── onAuthStateChange ─────────────────────────────────────────────────

  describe('onAuthStateChange', () => {
    it('should call onAuthStateChanged with callback', () => {
      const callback = jest.fn();
      onAuthStateChange(callback);

      expect(onAuthStateChanged).toHaveBeenCalledTimes(1);
      expect(onAuthStateChanged).toHaveBeenCalledWith(expect.anything(), callback);
    });

    it('should return an unsubscribe function', () => {
      const mockUnsubscribe = jest.fn();
      (onAuthStateChanged as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = onAuthStateChange(jest.fn());
      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow calling unsubscribe', () => {
      const mockUnsubscribe = jest.fn();
      (onAuthStateChanged as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = onAuthStateChange(jest.fn());
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Error Code Mapping Coverage ───────────────────────────────────────

  describe('error code mapping coverage', () => {
    const errorCases = [
      {
        code: 'auth/email-already-in-use',
        expected: 'This email is already registered. Please sign in instead.',
      },
      { code: 'auth/invalid-email', expected: 'Please enter a valid email address.' },
      { code: 'auth/operation-not-allowed', expected: 'This sign-in method is not enabled.' },
      { code: 'auth/weak-password', expected: 'Password should be at least 6 characters.' },
      { code: 'auth/user-disabled', expected: 'This account has been disabled.' },
      { code: 'auth/user-not-found', expected: 'No account found with this email address.' },
      { code: 'auth/wrong-password', expected: 'Incorrect password. Please try again.' },
      {
        code: 'auth/too-many-requests',
        expected: 'Too many failed attempts. Please try again later.',
      },
      {
        code: 'auth/network-request-failed',
        expected: 'Network error. Please check your connection.',
      },
      { code: 'auth/invalid-credential', expected: 'Invalid email or password. Please try again.' },
    ];

    it.each(errorCases)('should map $code to user-friendly message', async ({ code, expected }) => {
      const firebaseError = { code, message: 'Firebase error' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signIn('test@example.com', 'password')).rejects.toThrow(expected);
    });

    it('should return generic message for unmapped error codes', async () => {
      const firebaseError = { code: 'auth/some-new-error', message: 'Firebase error' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(firebaseError);

      await expect(signIn('test@example.com', 'password')).rejects.toThrow(
        'An error occurred. Please try again.',
      );
    });
  });
});
