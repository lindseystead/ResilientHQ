/**
 * Settings Types
 *
 * Type definitions for all app settings.
 * Used across settings screen, providers, and storage.
 */

import { lightTheme } from '@/src/config/theme';

/**
 * Appearance settings
 */
export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  reduceMotion: boolean;
  traumaSafeMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extraLarge';
  highContrast: boolean;
}

/**
 * Security settings
 */
export interface SecuritySettings {
  biometricEnabled: boolean;
  requireAuthOnOpen: boolean;
  blurScreenOnBackground: boolean;
  preventScreenshots: boolean;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  enabled: boolean;
  moodCheckInReminders: boolean;
  journalingReminders: boolean;
  weeklyReports: boolean;
  communityActivity: boolean;
}

/**
 * Privacy & Data settings
 */
export interface PrivacySettings {
  privateProfile: boolean;
  exportDataEnabled: boolean;
  deleteAccountEnabled: boolean;
}

/**
 * AI Personalization settings
 */
export interface AISettings {
  tone: 'supportive' | 'direct' | 'professional' | 'coaching';
  responseLength: 'short' | 'medium' | 'long';
  journalingPromptsEnabled: boolean;
  chatMemoryEnabledByDefault: boolean;
  promptSuggestionsEnabledByDefault: boolean;
}

/**
 * Debug settings (developer mode only)
 */
export interface DebugSettings {
  showAppVersion: boolean;
  showDeviceInfo: boolean;
  showLastSyncTime: boolean;
  enableTestMode: boolean;
}

/**
 * Complete settings object
 */
export interface AppSettings {
  appearance: AppearanceSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  ai: AISettings;
  debug: DebugSettings;
}

/**
 * Settings update payload
 */
export type SettingsUpdate =
  | Partial<AppSettings>
  | {
      appearance?: Partial<AppearanceSettings>;
      security?: Partial<SecuritySettings>;
      notifications?: Partial<NotificationSettings>;
      privacy?: Partial<PrivacySettings>;
      ai?: Partial<AISettings>;
      debug?: Partial<DebugSettings>;
    };

/**
 * Default settings
 */
export const defaultSettings: AppSettings = {
  appearance: {
    theme: 'system',
    accentColor: lightTheme.colors.accent,
    reduceMotion: false,
    traumaSafeMode: false,
    fontSize: 'medium',
    highContrast: false,
  },
  security: {
    biometricEnabled: false,
    requireAuthOnOpen: false,
    blurScreenOnBackground: false,
    preventScreenshots: false,
  },
  notifications: {
    enabled: true,
    moodCheckInReminders: true,
    journalingReminders: true,
    weeklyReports: true,
    communityActivity: true,
  },
  privacy: {
    privateProfile: false,
    exportDataEnabled: true,
    deleteAccountEnabled: true,
  },
  ai: {
    tone: 'supportive',
    responseLength: 'medium',
    journalingPromptsEnabled: true,
    chatMemoryEnabledByDefault: true,
    promptSuggestionsEnabledByDefault: true,
  },
  debug: {
    showAppVersion: false,
    showDeviceInfo: false,
    showLastSyncTime: false,
    enableTestMode: false,
  },
};
