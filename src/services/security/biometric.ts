/**
 * Biometric Security Service
 *
 * Provides biometric authentication (Face ID, Touch ID, fingerprint).
 */

import { logger } from '@/src/shared/utils/debug';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export interface BiometricResult {
  success: boolean;
  error?: string;
}

/**
 * Biometric Security Service
 */
export class BiometricService {
  /**
   * Check if biometric authentication is available
   */
  static async isAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  }

  /**
   * Get available authentication types
   */
  static async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  }

  /**
   * Authenticate with biometrics
   */
  static async authenticate(reason?: string): Promise<BiometricResult> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device.',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to continue',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return {
        success: result.success,
        error: result.success ? undefined : 'Authentication failed',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Biometric authentication error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Store sensitive data securely
   */
  static async storeSecure(key: string, value: string): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      logger.error('Secure store error', error, { key });
      return false;
    }
  }

  /**
   * Retrieve sensitive data
   */
  static async getSecure(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error('Secure get error', error, { key });
      return null;
    }
  }

  /**
   * Remove sensitive data
   */
  static async removeSecure(key: string): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      logger.error('Secure remove error', error, { key });
      return false;
    }
  }
}
