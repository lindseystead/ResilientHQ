/**
 * Device Type Detection
 *
 * Detects device type (phone, tablet, foldable) using expo-device.
 * Provides utilities for device-specific layout adjustments.
 */

import * as Device from 'expo-device';
import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Device type enum
 */
export type DeviceType = 'phone' | 'tablet' | 'foldable' | 'desktop' | 'tv' | 'unknown';

/**
 * Get device type from expo-device
 *
 * @returns Device type string
 */
export const getDeviceType = (): DeviceType => {
  if (!Device.deviceType) {
    // Fallback: use screen width for web/unknown devices
    if (SCREEN_WIDTH >= 768) return 'tablet';
    return 'phone';
  }

  switch (Device.deviceType) {
    case Device.DeviceType.PHONE:
      return 'phone';
    case Device.DeviceType.TABLET:
      return 'tablet';
    case Device.DeviceType.DESKTOP:
      return 'desktop';
    case Device.DeviceType.TV:
      return 'tv';
    default:
      return 'unknown';
  }
};

/**
 * Check if device is a tablet
 *
 * @returns True if device is a tablet
 */
export const isTablet = (): boolean => {
  const deviceType = getDeviceType();
  return deviceType === 'tablet' || deviceType === 'foldable';
};

/**
 * Check if device is foldable
 *
 * Detects foldable devices by checking device model name patterns
 * and screen characteristics. Foldables typically have:
 * - Model names containing "Fold", "Duo", or similar
 * - Wider screens when unfolded
 * - Specific device type indicators
 *
 * @returns True if device appears to be foldable
 */
export const isFoldable = (): boolean => {
  const modelName = Device.modelName?.toLowerCase() || '';
  const foldableKeywords = ['fold', 'duo', 'flip', 'flex'];

  // Check model name for foldable indicators
  const hasFoldableKeyword = foldableKeywords.some((keyword) => modelName.includes(keyword));

  // Check if screen width suggests foldable (typically wider when unfolded)
  const isWideScreen = SCREEN_WIDTH >= 600 && SCREEN_WIDTH < 900;

  // Check device type (some foldables may report as tablet)
  const deviceType = getDeviceType();
  const isTabletLike = deviceType === 'tablet' || deviceType === 'foldable';

  return hasFoldableKeyword || (isWideScreen && isTabletLike && Platform.OS === 'android');
};
