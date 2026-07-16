/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the app.
 * Wired up with Firebase Authentication.
 */

import { clearSentryUser, setSentryUser } from '@/src/config/sentry.config';
import {
  auth,
  signIn as firebaseSignIn,
  signOut as firebaseSignOut,
  signUp as firebaseSignUp,
  onAuthStateChange,
  sendPasswordReset,
} from '@/src/services/firebase/auth';
import {
  AnalyticsEvents,
  clearUserData,
  setUserId,
  trackEvent,
} from '@/src/shared/utils/analytics';
import { logger } from '@/src/shared/utils/debug';
import { User } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  // Firebase-compatible methods
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
}

// Default context value to prevent errors during initialization
const defaultContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {},
  refreshUser: async () => {},
  login: async () => ({ success: false, error: 'Not initialized' }),
  signup: async () => ({ success: false, error: 'Not initialized' }),
  resetPassword: async () => ({ success: false, error: 'Not initialized' }),
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser: User | null) => {
      setUser(firebaseUser);
      setIsAuthenticated(!!firebaseUser);
      setIsLoading(false);

      // Update Sentry and Analytics user context
      if (firebaseUser) {
        setSentryUser(firebaseUser.uid);
        setUserId(firebaseUser.uid);
      } else {
        clearSentryUser();
        clearUserData();
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Firebase-compatible signup method with displayName support
  const signup = async (
    email: string,
    password: string,
    displayName?: string,
  ): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      trackEvent(AnalyticsEvents.SIGNUP_STARTED);
      const userCredential = await firebaseSignUp(email, password, displayName);
      setUser(userCredential.user);
      setIsAuthenticated(true);
      setIsLoading(false);
      trackEvent(AnalyticsEvents.SIGNUP_COMPLETED);
      return { success: true };
    } catch (error: unknown) {
      setIsLoading(false);
      trackEvent(AnalyticsEvents.ERROR_OCCURRED, { action: 'signup' });
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create account. Please try again.';
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Firebase-compatible login method
  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      trackEvent(AnalyticsEvents.LOGIN_STARTED);
      const userCredential = await firebaseSignIn(email, password);
      setUser(userCredential.user);
      setIsAuthenticated(true);
      setIsLoading(false);
      trackEvent(AnalyticsEvents.LOGIN_COMPLETED);
      return { success: true };
    } catch (error: unknown) {
      setIsLoading(false);
      trackEvent(AnalyticsEvents.ERROR_OCCURRED, { action: 'login' });
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to login. Please try again.';
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Reset password method
  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      await sendPasswordReset(email);
      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send password reset email.';
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Wrapper methods for compatibility
  const signIn = async (email: string, password: string) => {
    const result = await login(email, password);
    if (!result.success) {
      throw new Error(result.error || 'Login failed');
    }
  };

  const signUp = async (email: string, password: string) => {
    const result = await signup(email, password);
    if (!result.success) {
      throw new Error(result.error || 'Sign up failed');
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await firebaseSignOut();
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      trackEvent(AnalyticsEvents.LOGOUT);
    } catch (error: unknown) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      throw new Error(errorMessage);
    }
  };

  const refreshUser = async () => {
    if (!auth?.currentUser) return;
    try {
      await auth.currentUser.reload();
      setUser(auth.currentUser);
      setIsAuthenticated(!!auth.currentUser);
    } catch (error: unknown) {
      logger.error(
        'Error refreshing user',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        signIn,
        signOut,
        signUp,
        refreshUser,
        login,
        signup,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  // Context should always have a value now (default or provider value)
  // But we'll keep this check for safety in case of module loading issues
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
