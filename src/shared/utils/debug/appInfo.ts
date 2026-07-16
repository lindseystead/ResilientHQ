/**
 * App Info Debug Utilities
 *
 * Provides app version and build information.
 */

import Constants from 'expo-constants';

export interface AppInfo {
  appVersion: string;
  buildNumber: string | null;
  runtimeVersion: string | null;
  environment: 'development' | 'production';
  isDev: boolean;
}

/**
 * Get app information
 */
export function getAppInfo(): AppInfo {
  const runtimeVersion = Constants.expoConfig?.runtimeVersion;
  return {
    appVersion: Constants.expoConfig?.version || '1.0.0',
    buildNumber:
      Constants.expoConfig?.ios?.buildNumber ||
      Constants.expoConfig?.android?.versionCode?.toString() ||
      null,
    runtimeVersion: typeof runtimeVersion === 'string' ? runtimeVersion : null,
    environment: __DEV__ ? 'development' : 'production',
    isDev: __DEV__,
  };
}

/**
 * Format app info as string
 */
export function formatAppInfo(): string {
  const info = getAppInfo();
  return `
App Version: ${info.appVersion}
Build Number: ${info.buildNumber || 'N/A'}
Runtime Version: ${info.runtimeVersion || 'N/A'}
Environment: ${info.environment}
  `.trim();
}
