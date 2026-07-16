/**
 * Jest Configuration
 *
 * Production-grade testing setup for React Native with Expo and TypeScript.
 * Includes comprehensive coverage thresholds and proper test environment setup.
 */

module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@sentry/.*|date-fns|firebase|@firebase))',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/index.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
  ],
  coverageReporters: ['text', 'lcov', 'clover', 'json-summary'],
  // Global thresholds track the committed coverage baseline
  // (scripts/quality/coverage-baseline.json) and are enforced as a ratchet:
  // they only move up. Coverage is deliberately concentrated on high-risk logic
  // (validation, formatting, and chatbot utils below) rather than spread thinly
  // across the large, integration-tested screen files.
  coverageThreshold: {
    global: {
      branches: 26,
      functions: 27,
      lines: 37,
      statements: 36,
    },
    './src/features/chatbot/utils/': {
      branches: 60,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/shared/utils/format/': {
      branches: 85,
      functions: 95,
      lines: 85,
      statements: 85,
    },
    './src/shared/utils/validation/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 10000,
  verbose: true,
};
