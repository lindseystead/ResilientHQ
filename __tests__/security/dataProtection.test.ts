import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineQueueSecureStorageError } from '@/src/services/offline/errors';
import { CacheService } from '@/src/services/offline/cache';
import { UserPreferencesStorage } from '@/src/shared/utils/storage/userPreferences';
import { setSecureValueStrict } from '@/src/shared/utils/storage/secureStore';

const mockSecureMap = new Map<string, string>();

jest.mock('@/src/shared/utils/storage/secureStore', () => ({
  setSecureValueStrict: jest.fn(async (key: string, value: string) => {
    mockSecureMap.set(key, value);
    return { ok: true as const };
  }),
  getSecureValueStrict: jest.fn(async (key: string) => mockSecureMap.get(key) ?? null),
  removeSecureValue: jest.fn(async (key: string) => {
    mockSecureMap.delete(key);
  }),
}));

describe('Security - Data Protection', () => {
  beforeEach(async () => {
    mockSecureMap.clear();
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('stores sensitive preferences outside plain AsyncStorage preference blobs', async () => {
    const stored = await UserPreferencesStorage.setPreference('authToken', 'token-123');
    expect(stored).toBe(true);

    const plainPrefs = await AsyncStorage.getItem('@resilienthq:preferences');
    expect(plainPrefs).toBeNull();
    expect(mockSecureMap.get('preference:authToken')).toBe(JSON.stringify('token-123'));

    const resolved = await UserPreferencesStorage.getPreference<string>('authToken');
    expect(resolved).toBe('token-123');
  });

  it('keeps queued payload content out of plaintext queue records', async () => {
    const queueId = await CacheService.addToQueue('sync-profile', {
      token: 'secret-token',
      notes: 'private reflection text',
    });

    const queueRecord = await AsyncStorage.getItem(`@resilienthq_queue:${queueId}`);
    expect(queueRecord).toBeTruthy();
    expect(queueRecord).not.toContain('secret-token');
    expect(queueRecord).not.toContain('private reflection text');

    const queue = await CacheService.getQueue();
    expect(queue[0]?.payload).toEqual({
      token: 'secret-token',
      notes: 'private reflection text',
    });
  });

  it('does not enqueue when secure storage rejects the payload', async () => {
    const setStrict = setSecureValueStrict as jest.MockedFunction<typeof setSecureValueStrict>;
    setStrict.mockResolvedValueOnce({ ok: false, reason: 'unavailable', byteLength: 2 });

    await expect(CacheService.addToQueue('sync-profile', { x: 1 })).rejects.toBeInstanceOf(
      OfflineQueueSecureStorageError,
    );

    const keys = await AsyncStorage.getAllKeys();
    expect(keys.some((k) => k.startsWith('@resilienthq_queue:'))).toBe(false);
    expect(mockSecureMap.size).toBe(0);
  });

  it('returns false when sensitive preference cannot be stored securely', async () => {
    const setStrict = setSecureValueStrict as jest.MockedFunction<typeof setSecureValueStrict>;
    setStrict.mockResolvedValueOnce({ ok: false, reason: 'write_failed', byteLength: 4 });

    const stored = await UserPreferencesStorage.setPreference('authToken', 'x');
    expect(stored).toBe(false);
    expect(mockSecureMap.has('preference:authToken')).toBe(false);
  });

  it('clears both plaintext and secure preference records', async () => {
    await UserPreferencesStorage.setPreference('coachTone', 'gentle');
    await UserPreferencesStorage.setPreference('privateNote', 'keep-safe');

    const cleared = await UserPreferencesStorage.clearPreferences();
    expect(cleared).toBe(true);
    expect(await AsyncStorage.getItem('@resilienthq:preferences')).toBeNull();
    expect(await AsyncStorage.getItem('@resilienthq:preferences:secure-index')).toBeNull();
    expect(mockSecureMap.size).toBe(0);
  });
});
