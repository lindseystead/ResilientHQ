/**
 * Test Helpers
 *
 * Production-grade test utilities for React Native components and hooks.
 * Provides reusable test setup, mocks, and assertion helpers.
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/src/providers/ThemeProvider';
import { AuthProvider } from '@/src/providers/AuthProvider';
import { AppSecurityProvider } from '@/src/providers/AppSecurityProvider';
import { AISettingsProvider } from '@/src/providers/AISettingsProvider';
import { TraumaSafeModeProvider } from '@/src/providers/TraumaSafeModeProvider';

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
};

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider>
        <AuthProvider>
          <TraumaSafeModeProvider>
            <AppSecurityProvider>
              <AISettingsProvider>{children}</AISettingsProvider>
            </AppSecurityProvider>
          </TraumaSafeModeProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export const renderWithTheme = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  const ThemeWrapper = ({ children }: { children: React.ReactNode }) => (
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider>
        <TraumaSafeModeProvider>{children}</TraumaSafeModeProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );

  return render(ui, { wrapper: ThemeWrapper, ...options });
};

export const renderWithAuth = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  const AuthWrapper = ({ children }: { children: React.ReactNode }) => (
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider>
        <AuthProvider>
          <TraumaSafeModeProvider>
            <AppSecurityProvider>
              <AISettingsProvider>{children}</AISettingsProvider>
            </AppSecurityProvider>
          </TraumaSafeModeProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );

  return render(ui, { wrapper: AuthWrapper, ...options });
};

export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
};

export const mockAuthState = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  sendPasswordReset: jest.fn(),
};

export const mockUnauthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  sendPasswordReset: jest.fn(),
};

export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  canGoBack: jest.fn(() => true),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
});

export const createMockRoute = (params = {}) => ({
  key: 'test-route',
  name: 'TestScreen',
  params,
});

export * from '@testing-library/react-native';
export { customRender as render };
