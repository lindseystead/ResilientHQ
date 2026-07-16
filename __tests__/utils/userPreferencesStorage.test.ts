import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferencesStorage } from '@/src/shared/utils/storage/userPreferences';
import { defaultSettings } from '@/src/types/settings';

jest.mock('@/src/shared/utils/debug', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('UserPreferencesStorage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('returns default settings when storage is empty', async () => {
    const settings = await UserPreferencesStorage.loadSettings();

    expect(settings).toEqual(defaultSettings);
  });

  it('merges persisted settings with defaults', async () => {
    await AsyncStorage.setItem(
      '@resilienthq:settings',
      JSON.stringify({
        appearance: { theme: 'dark' },
        security: { biometricEnabled: true },
      }),
    );

    const settings = await UserPreferencesStorage.loadSettings();

    expect(settings.appearance.theme).toBe('dark');
    expect(settings.security.biometricEnabled).toBe(true);
    expect(settings.notifications).toEqual(defaultSettings.notifications);
    expect(settings.ai).toEqual(defaultSettings.ai);
  });

  it('updates settings and persists merged values', async () => {
    const updated = await UserPreferencesStorage.updateSettings({
      privacy: { privateProfile: true },
      notifications: { enabled: false },
    });

    expect(updated).toBe(true);

    const reloaded = await UserPreferencesStorage.loadSettings();
    expect(reloaded.privacy.privateProfile).toBe(true);
    expect(reloaded.notifications.enabled).toBe(false);
    expect(reloaded.appearance).toEqual(defaultSettings.appearance);
  });

  it('stores and retrieves generic preferences with defaults', async () => {
    const stored = await UserPreferencesStorage.setPreference('coachTone', 'gentle');
    expect(stored).toBe(true);

    const value = await UserPreferencesStorage.getPreference<string>('coachTone');
    const fallback = await UserPreferencesStorage.getPreference<string>('missing', 'default');

    expect(value).toBe('gentle');
    expect(fallback).toBe('default');
  });

  it('returns false when saveSettings fails', async () => {
    const setItemSpy = jest
      .spyOn(AsyncStorage, 'setItem')
      .mockRejectedValueOnce(new Error('write failed'));

    const result = await UserPreferencesStorage.saveSettings(defaultSettings);

    expect(result).toBe(false);
    setItemSpy.mockRestore();
  });
});
