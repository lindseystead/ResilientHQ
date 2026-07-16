/**
 * API Configuration
 *
 * Centralized first-party API configuration for mobile clients.
 * Secrets remain on the server; the app only calls trusted backend routes.
 */

import { apiEnv, isApiConfigured } from './env';

/**
 * AI proxy configuration
 */
export const openaiConfig = {
  endpoints: {
    aiChat: '/ai/chat',
    aiChatStream: '/ai/chat/stream',
  },

  // Use up-to-date models
  models: {
    chat: 'gpt-4o-mini',
    analysis: 'gpt-4o-mini',
    fallback: 'gpt-4o-mini',
  },

  default: {
    temperature: 0.7,
    maxTokens: 800,
    stream: false,
  },
} as const;

/**
 * Retrieve the application API base URL.
 *
 * This points at a first-party backend that proxies AI requests.
 */
export const getApiBaseUrl = (): string => {
  const baseUrl = apiEnv.baseUrl?.trim();

  if (!baseUrl) {
    throw new Error(
      'Application API URL missing. Set EXPO_PUBLIC_API_URL to your backend base URL.',
    );
  }

  return baseUrl.replace(/\/+$/, '');
};

/**
 * Check if the AI proxy is configured
 */
export const isOpenAIConfigured = (): boolean => isApiConfigured();

/**
 * Global API request configuration
 */
export const apiConfig = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

/**
 * Utility: Build full endpoint URLs
 */
export const buildUrl = (endpoint: string): string => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${getApiBaseUrl()}${normalizedEndpoint}`;
};
