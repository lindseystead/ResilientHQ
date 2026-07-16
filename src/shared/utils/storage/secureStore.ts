/**
 * Secure storage for sensitive local data (offline queue payloads, sensitive preferences).
 *
 * Writes use expo-secure-store only — no plaintext AsyncStorage fallback (fail closed).
 * Reads try SecureStore first, then legacy fallback keys for items written before this policy.
 * Removes always clear both locations.
 *
 * @see https://docs.expo.dev/versions/latest/sdk/securestore/
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const FALLBACK_PREFIX = '@resilienthq:secure-fallback:';

const toFallbackKey = (key: string) => `${FALLBACK_PREFIX}${key}`;

const getUtf8ByteLength = (value: string): number => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }
  return value.length;
};

/** Documented historical iOS constraint; we still attempt larger writes and rely on native errors when possible. */
export const SECURE_STORE_RECOMMENDED_MAX_BYTES = 2048;

/** Hard cap to avoid pathological allocations / native issues */
const SECURE_STORE_ABSOLUTE_MAX_BYTES = 512 * 1024;

export type SecureWriteFailureReason = 'unavailable' | 'too_large' | 'write_failed';

export type SecureWriteResult =
  | { ok: true }
  | { ok: false; reason: SecureWriteFailureReason; byteLength: number };

const isLikelySizeRelatedMessage = (message: string): boolean => {
  const m = message.toLowerCase();
  return (
    m.includes('too large') ||
    m.includes('maximum') ||
    m.includes('exceed') ||
    m.includes('length') ||
    m.includes('size limit') ||
    m.includes('data too big')
  );
};

/**
 * Store a value in hardware-backed secure storage only.
 * Never writes sensitive data to AsyncStorage.
 */
export const setSecureValueStrict = async (
  key: string,
  value: string,
): Promise<SecureWriteResult> => {
  const byteLength = getUtf8ByteLength(value);

  if (Platform.OS === 'web') {
    return { ok: false, reason: 'unavailable', byteLength };
  }

  if (byteLength > SECURE_STORE_ABSOLUTE_MAX_BYTES) {
    return { ok: false, reason: 'too_large', byteLength };
  }

  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) {
      return { ok: false, reason: 'unavailable', byteLength };
    }
  } catch {
    return { ok: false, reason: 'unavailable', byteLength };
  }

  try {
    await SecureStore.setItemAsync(key, value);
    await AsyncStorage.removeItem(toFallbackKey(key));
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isLikelySizeRelatedMessage(message)) {
      return { ok: false, reason: 'too_large', byteLength };
    }
    return { ok: false, reason: 'write_failed', byteLength };
  }
};

/**
 * Read a sensitive value: SecureStore first, then legacy AsyncStorage fallback (pre–strict-policy data).
 */
export const getSecureValueStrict = async (key: string): Promise<string | null> => {
  if (Platform.OS !== 'web') {
    try {
      const secure = await SecureStore.getItemAsync(key);
      if (secure !== null) {
        return secure;
      }
    } catch {
      // Fall through to legacy fallback read.
    }
  }

  return AsyncStorage.getItem(toFallbackKey(key));
};

/**
 * Remove value from SecureStore and any legacy AsyncStorage fallback entry.
 */
export const removeSecureValue = async (key: string): Promise<void> => {
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Continue to clear fallback.
    }
  }

  await AsyncStorage.removeItem(toFallbackKey(key));
};
