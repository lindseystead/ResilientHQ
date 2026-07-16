/**
 * User Preferences Storage
 *
 * Manages persistent storage of user preferences and settings.
 * Uses AsyncStorage for cross-platform compatibility.
 */

import { AppSettings, SettingsUpdate, defaultSettings } from '@/src/types/settings';
import { logger } from '@/src/shared/utils/debug';
import {
  getSecureValueStrict,
  removeSecureValue,
  setSecureValueStrict,
} from '@/src/shared/utils/storage/secureStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@resilienthq:settings';
const PREFERENCES_KEY = '@resilienthq:preferences';
const SECURE_PREFERENCE_INDEX_KEY = '@resilienthq:preferences:secure-index';
const SENSITIVE_PREFERENCE_KEY_PATTERN = /(token|secret|auth|password|passcode|biometric|private)/i;

const parseStoredRecord = (data: string | null): Record<string, unknown> => {
  if (!data) {
    return {};
  }

  try {
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

const isSensitivePreferenceKey = (key: string) => SENSITIVE_PREFERENCE_KEY_PATTERN.test(key);

const readSecurePreferenceIndex = async (): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(SECURE_PREFERENCE_INDEX_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((key) => typeof key === 'string') : [];
  } catch {
    return [];
  }
};

const writeSecurePreferenceIndex = async (keys: string[]): Promise<void> => {
  await AsyncStorage.setItem(
    SECURE_PREFERENCE_INDEX_KEY,
    JSON.stringify(Array.from(new Set(keys))),
  );
};

/**
 * User Preferences Storage Service
 */
export class UserPreferencesStorage {
  /**
   * Load settings from storage
   */
  static async loadSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!data) return defaultSettings;

      const settings = JSON.parse(data);
      // Merge with defaults to ensure all fields exist
      return {
        appearance: { ...defaultSettings.appearance, ...settings.appearance },
        security: { ...defaultSettings.security, ...settings.security },
        notifications: { ...defaultSettings.notifications, ...settings.notifications },
        privacy: { ...defaultSettings.privacy, ...settings.privacy },
        ai: { ...defaultSettings.ai, ...settings.ai },
        debug: { ...defaultSettings.debug, ...settings.debug },
      };
    } catch (error) {
      logger.error('Error loading settings', error);
      return defaultSettings;
    }
  }

  /**
   * Save settings to storage
   */
  static async saveSettings(settings: AppSettings): Promise<boolean> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      logger.error('Error saving settings', error);
      return false;
    }
  }

  /**
   * Update specific settings section
   */
  static async updateSettings(updates: SettingsUpdate): Promise<boolean> {
    try {
      const current = await this.loadSettings();
      const updated = {
        appearance: { ...current.appearance, ...updates.appearance },
        security: { ...current.security, ...updates.security },
        notifications: { ...current.notifications, ...updates.notifications },
        privacy: { ...current.privacy, ...updates.privacy },
        ai: { ...current.ai, ...updates.ai },
        debug: { ...current.debug, ...updates.debug },
      };
      return await this.saveSettings(updated);
    } catch (error) {
      logger.error('Error updating settings', error);
      return false;
    }
  }

  /**
   * Reset settings to defaults
   */
  static async resetSettings(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
      return true;
    } catch (error) {
      logger.error('Error resetting settings', error);
      return false;
    }
  }

  /**
   * Store generic preference
   */
  static async setPreference(key: string, value: unknown): Promise<boolean> {
    try {
      if (isSensitivePreferenceKey(key)) {
        const stored = await setSecureValueStrict(`preference:${key}`, JSON.stringify(value));
        if (!stored.ok) {
          logger.warn('Sensitive preference not stored: secure storage unavailable or full', {
            key,
            reason: stored.reason,
          });
          return false;
        }
        const secureKeys = await readSecurePreferenceIndex();
        if (!secureKeys.includes(key)) {
          await writeSecurePreferenceIndex([...secureKeys, key]);
        }
        return true;
      }

      const prefs = await this.getPreferences();
      prefs[key] = value;
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
      return true;
    } catch (error) {
      logger.error('Error setting preference', error, { key });
      return false;
    }
  }

  /**
   * Get generic preference
   */
  static async getPreference<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      if (isSensitivePreferenceKey(key)) {
        const secureValue = await getSecureValueStrict(`preference:${key}`);
        if (secureValue === null) {
          return defaultValue ?? null;
        }

        try {
          return JSON.parse(secureValue) as T;
        } catch {
          return defaultValue ?? null;
        }
      }

      const prefs = await this.getPreferences();
      return (prefs[key] as T | undefined) ?? defaultValue ?? null;
    } catch (error) {
      logger.error('Error getting preference', error, { key });
      return defaultValue ?? null;
    }
  }

  /**
   * Get all preferences
   */
  static async getPreferences(): Promise<Record<string, unknown>> {
    try {
      const basePreferences = parseStoredRecord(await AsyncStorage.getItem(PREFERENCES_KEY));
      const secureKeys = await readSecurePreferenceIndex();

      if (secureKeys.length === 0) {
        return basePreferences;
      }

      const secureEntries: [string, unknown | undefined][] = await Promise.all(
        secureKeys.map(async (key) => {
          const raw = await getSecureValueStrict(`preference:${key}`);
          if (raw === null) {
            return [key, undefined] as [string, undefined];
          }

          try {
            return [key, JSON.parse(raw)] as [string, unknown];
          } catch {
            return [key, undefined] as [string, undefined];
          }
        }),
      );

      secureEntries.forEach(([key, value]) => {
        if (value !== undefined) {
          basePreferences[key] = value;
        }
      });

      return basePreferences;
    } catch (error) {
      logger.error('Error getting preferences', error);
      return {};
    }
  }

  /**
   * Clear all preferences
   */
  static async clearPreferences(): Promise<boolean> {
    try {
      const secureKeys = await readSecurePreferenceIndex();
      await Promise.all(secureKeys.map((key) => removeSecureValue(`preference:${key}`)));
      await AsyncStorage.removeItem(SECURE_PREFERENCE_INDEX_KEY);
      await AsyncStorage.removeItem(PREFERENCES_KEY);
      return true;
    } catch (error) {
      logger.error('Error clearing preferences', error);
      return false;
    }
  }
}
