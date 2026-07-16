/**
 * Environment Variables Configuration
 *
 * Centralized environment variable management for Expo (web + native).
 * Handles EXPO_PUBLIC_* variables from:
 *  - process.env (dev server)
 *  - Constants.expoConfig.extra (EAS builds)
 *
 * Fully type-safe and production-hardened.
 */

import Constants from 'expo-constants';

// Type declaration for process.env (web compatibility)
declare const process: {
  env: Record<string, string | undefined>;
  NODE_ENV?: string;
};

type ExtraConfig = Record<string, string | undefined>;

// Extract Expo extra safely
const extra: ExtraConfig =
  (Constants.expoConfig?.extra as ExtraConfig) || (Constants.manifest2?.extra as ExtraConfig) || {};

/**
 * Normalize key: EXPO_PUBLIC_FIREBASE_API_KEY → firebaseapikey
 */
const normalizeKey = (key: string) =>
  key.replace('EXPO_PUBLIC_', '').replace(/_/g, '').toLowerCase();

/**
 * Safely gets an environment variable.
 *
 * Order of lookup:
 * 1. process.env (Expo dev mode)
 * 2. Expo build config extra fields
 */
const getEnvVar = (key: string, fallback?: string): string | undefined => {
  const normalized = normalizeKey(key);

  const value = process.env[key] || extra[normalized] || fallback;

  // Ignore placeholders or blank values
  if (!value || value === '' || value.includes('YOUR_') || value.includes('PLACEHOLDER')) {
    return undefined;
  }

  return value;
};

/**
 * Firebase configuration
 */
export const firebaseEnv = {
  apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID'),
} as const;

export const isFirebaseConfigured = (): boolean => {
  return Object.values(firebaseEnv).every(Boolean);
};

/**
 * Application API configuration
 *
 * The mobile client must talk only to first-party APIs.
 * Third-party secrets (for example OpenAI keys) stay server-side.
 */
export const apiEnv = {
  baseUrl: getEnvVar('EXPO_PUBLIC_API_URL'),
} as const;

export const isApiConfigured = (): boolean => {
  return !!apiEnv.baseUrl;
};

/**
 * App configuration
 */
export const appEnv = {
  environment: getEnvVar('EXPO_PUBLIC_ENV', 'development'),
  apiUrl: getEnvVar('EXPO_PUBLIC_API_URL'),
  build: Constants.expoConfig?.runtimeVersion || 'unknown',
  isDev: process.env.NODE_ENV === 'development',
} as const;

/**
 * Missing required env variables
 */
export const getMissingEnvVars = (): string[] => {
  const required = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ];

  return required.filter((key) => !getEnvVar(key));
};
