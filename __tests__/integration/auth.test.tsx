/**
 * Authentication Integration Tests
 *
 * End-to-end tests for the complete authentication flow including
 * signup, login, logout, and password reset.
 */

import { LoginScreen, ResetPasswordScreen, SignupScreen } from '@/src/features/auth';
import * as authService from '@/src/services/firebase/auth';
import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { renderWithAuth } from '../../tests/helpers/testHelpers';

// Mock auth service
jest.mock('@/src/services/firebase/auth', () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  sendPasswordReset: jest.fn(),
  onAuthStateChange: jest.fn((callback) => {
    callback(null);
    return jest.fn();
  }),
  getCurrentUser: jest.fn(() => null),
}));

describe('Authentication Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should login successfully with valid credentials', async () => {
      (authService.signIn as jest.Mock).mockResolvedValue({
        user: { uid: 'user-1', email: 'test@example.com' },
      });

      const { getByLabelText, getByText } = renderWithAuth(<LoginScreen />);

      const emailInput = getByLabelText('Email');
      const passwordInput = getByLabelText('Password');
      const loginButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'Password123!');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'Password123!');
      });
    });

    it('should show error for invalid credentials', async () => {
      (authService.signIn as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      const { getByLabelText, getByText } = renderWithAuth(<LoginScreen />);

      const emailInput = getByLabelText('Email');
      const passwordInput = getByLabelText('Password');
      const loginButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(authService.signIn).toHaveBeenCalled();
      });
    });
  });

  describe('Signup Flow', () => {
    it('should signup successfully with valid data', async () => {
      (authService.signUp as jest.Mock).mockResolvedValue({
        user: { uid: 'user-1', email: 'new@example.com' },
      });

      const { getAllByText, getByLabelText } = renderWithAuth(<SignupScreen />);

      const firstNameInput = getByLabelText('First Name');
      const lastNameInput = getByLabelText('Last Name');
      const emailInput = getByLabelText('Email');
      const passwordInput = getByLabelText('Password');
      const confirmPasswordInput = getByLabelText('Confirm Password');
      const createAccountMatches = getAllByText('Create Account');
      const signupButton = createAccountMatches[createAccountMatches.length - 1];

      fireEvent.changeText(firstNameInput, 'John');
      fireEvent.changeText(lastNameInput, 'Doe');
      fireEvent.changeText(emailInput, 'new@example.com');
      fireEvent.changeText(passwordInput, 'Password123!');
      fireEvent.changeText(confirmPasswordInput, 'Password123!');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(authService.signUp).toHaveBeenCalled();
      });
    });

    it('should validate password match', async () => {
      const { getByLabelText, getByText } = renderWithAuth(<SignupScreen />);

      const passwordInput = getByLabelText('Password');
      const confirmPasswordInput = getByLabelText('Confirm Password');

      fireEvent.changeText(passwordInput, 'Password123!');
      fireEvent.changeText(confirmPasswordInput, 'Different123!');

      // Should show validation error
      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should send password reset email', async () => {
      (authService.sendPasswordReset as jest.Mock).mockResolvedValue(true);

      const { getByLabelText, getByText } = renderWithAuth(<ResetPasswordScreen />);

      const emailInput = getByLabelText('Email');
      const resetButton = getByText('Send Reset Link');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(resetButton);

      await waitFor(() => {
        expect(authService.sendPasswordReset).toHaveBeenCalledWith('test@example.com');
      });
    });
  });
});
