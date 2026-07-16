/**
 * Test Utilities
 *
 * Utilities for testing features in development mode.
 */

import { requestChatCompletion } from '@/src/domains/ai';
import { BiometricService } from '@/src/services/security/biometric';
import { Alert } from 'react-native';

interface NotificationPreview {
  title: string;
  body: string;
}

/**
 * Test biometric authentication
 */
export async function testBiometric(): Promise<void> {
  try {
    const available = await BiometricService.isAvailable();
    if (!available) {
      Alert.alert('Biometric Test', 'Biometric authentication is not available on this device.');
      return;
    }

    const result = await BiometricService.authenticate('Test biometric authentication');
    if (result.success) {
      Alert.alert('Biometric Test', '✅ Biometric authentication successful!');
    } else {
      Alert.alert('Biometric Test', `❌ Authentication failed: ${result.error}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    Alert.alert('Biometric Test', `Error: ${errorMessage}`);
  }
}

/**
 * Test AI service connectivity through the first-party backend.
 */
export async function testAIService(): Promise<void> {
  try {
    Alert.alert('AI Service Test', 'Testing AI service...');

    const response = await requestChatCompletion([
      { role: 'user', content: 'Say "Hello" if you can hear me.' },
    ]);

    if (response.error) {
      Alert.alert('AI Service Test', `❌ Error: ${response.error}`);
    } else {
      Alert.alert('AI Service Test', `✅ Response: ${response.content}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    Alert.alert('AI Service Test', `Error: ${errorMessage}`);
  }
}

export const testOpenAI = testAIService;

/**
 * Test notification (placeholder)
 */
export async function testNotification(preview?: NotificationPreview): Promise<void> {
  Alert.alert(
    preview?.title ?? 'Notification Test',
    preview?.body ?? 'Notification system would be tested here. Requires expo-notifications setup.',
  );
}
