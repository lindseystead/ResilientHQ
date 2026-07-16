import { Platform } from 'react-native';

let isInstalled = false;

const shouldSuppressFirestoreBlockedError = (message: string): boolean =>
  message.includes('ERR_BLOCKED_BY_CLIENT') && message.includes('firestore.googleapis.com');

export const installFirestoreBlockedErrorSuppression = (): void => {
  if (isInstalled || Platform.OS !== 'web') {
    return;
  }

  if (typeof window === 'undefined' || !window.addEventListener) {
    return;
  }

  const originalError = console.error;

  console.error = (...args: unknown[]) => {
    const message = args.map((arg) => String(arg)).join(' ');
    if (shouldSuppressFirestoreBlockedError(message)) {
      return;
    }

    originalError.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (!reason || typeof reason !== 'object' || !('message' in reason)) {
      return;
    }

    const message = String((reason as { message?: unknown }).message || '');
    if (shouldSuppressFirestoreBlockedError(message)) {
      event.preventDefault();
    }
  });

  isInstalled = true;
};
