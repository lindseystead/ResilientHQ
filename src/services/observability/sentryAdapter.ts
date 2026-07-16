import { Platform } from 'react-native';
import { loadOptionalModule } from '@/src/shared/utils/runtime/optionalModule';

export interface SentryEvent {
  exception?: unknown;
  user?: { id?: string; email?: string; username?: string } | null;
  request?: unknown;
  contexts?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SentryInitOptions {
  dsn: string;
  debug: boolean;
  environment: string | undefined;
  enableAutoSessionTracking: boolean;
  sessionTrackingIntervalMillis: number;
  tracesSampleRate: number;
  sendDefaultPii?: boolean;
  beforeSend?: (event: SentryEvent, hint: { originalException?: unknown }) => SentryEvent | null;
}

export interface SentryExceptionContext {
  contexts?: Record<string, unknown>;
  tags?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

export interface SentryClient {
  init: (options: SentryInitOptions) => void;
  setUser: (user: { id: string; email?: string; username?: string } | null) => void;
  captureMessage: (
    message: string,
    level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal',
  ) => void;
  captureException: (error: Error, context?: SentryExceptionContext) => void;
}

const sentryClient =
  Platform.OS === 'web' ? null : loadOptionalModule<SentryClient>('@sentry/react-native');

export const getSentryClient = (): SentryClient | null => sentryClient;
