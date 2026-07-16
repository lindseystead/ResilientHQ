/**
 * useAuth Hook Tests
 *
 * Tests for the authentication hook that manages user state and auth operations.
 */

import { useAuth } from '@/src/shared/hooks/useAuth';
import { AuthProvider } from '@/src/providers/AuthProvider';
import * as firebaseAuth from '@/src/services/firebase/auth';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { act } from 'react-test-renderer';

// Mock Firebase auth service
jest.mock('@/src/services/firebase/auth', () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  sendPasswordReset: jest.fn(),
  getCurrentUser: jest.fn(),
  onAuthStateChange: jest.fn(),
}));

// Mock AuthProvider wrapper
const createWrapper = () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(AuthProvider, null, children);
  };
  return Wrapper;
};

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with an unauthenticated settled state', () => {
    (firebaseAuth.getCurrentUser as jest.Mock).mockReturnValue(null);
    (firebaseAuth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle sign in successfully', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    (firebaseAuth.signIn as jest.Mock).mockResolvedValue({ user: mockUser });
    (firebaseAuth.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (firebaseAuth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signIn('test@example.com', 'password123');
    });

    expect(firebaseAuth.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should handle sign up successfully', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    (firebaseAuth.signUp as jest.Mock).mockResolvedValue({ user: mockUser });
    (firebaseAuth.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (firebaseAuth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signUp('test@example.com', 'password123');
    });

    expect(firebaseAuth.signUp).toHaveBeenCalledWith('test@example.com', 'password123', undefined);
  });

  it('should handle sign out', async () => {
    (firebaseAuth.signOut as jest.Mock).mockResolvedValue(undefined);
    (firebaseAuth.getCurrentUser as jest.Mock).mockReturnValue(null);
    (firebaseAuth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(firebaseAuth.signOut).toHaveBeenCalled();
  });

  it('should handle password reset', async () => {
    (firebaseAuth.sendPasswordReset as jest.Mock).mockResolvedValue(undefined);
    (firebaseAuth.getCurrentUser as jest.Mock).mockReturnValue(null);
    (firebaseAuth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.resetPassword('test@example.com');
    });

    expect(firebaseAuth.sendPasswordReset).toHaveBeenCalledWith('test@example.com');
  });

  it('should handle auth state changes', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
    };

    let authCallback: ((user: any) => void) | null = null;

    (firebaseAuth.getCurrentUser as jest.Mock).mockReturnValue(null);
    (firebaseAuth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      authCallback = callback;
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });

    // Simulate auth state change
    act(() => {
      if (authCallback) {
        authCallback(mockUser);
      }
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
  });

  it('should handle errors during sign in', async () => {
    const error = new Error('Invalid credentials');
    (firebaseAuth.signIn as jest.Mock).mockRejectedValue(error);
    (firebaseAuth.getCurrentUser as jest.Mock).mockReturnValue(null);
    (firebaseAuth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.signIn('test@example.com', 'wrongpassword');
      } catch (e) {
        expect(e).toEqual(error);
      }
    });
  });
});
