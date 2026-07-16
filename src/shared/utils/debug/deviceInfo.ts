/**
 * Device Info Debug Utilities
 *
 * Provides device information for debugging and support.
 */

import * as Device from 'expo-device';
import { Dimensions, PixelRatio, Platform } from 'react-native';

export interface DeviceInfo {
  platform: string;
  osVersion: string | null;
  deviceName: string | null;
  deviceType: string | null;
  screenDimensions: {
    width: number;
    height: number;
    scale: number;
    fontScale: number;
  };
  appVersion: string;
  buildNumber: string | null;
}

/**
 * Get device information
 */
export function getDeviceInfo(): DeviceInfo {
  const { width, height } = Dimensions.get('window');
  const scale = PixelRatio.get();
  const fontScale = PixelRatio.getFontScale();

  return {
    platform: Platform.OS,
    osVersion: Platform.Version.toString(),
    deviceName: Device.deviceName || null,
    deviceType: Device.deviceType ? Device.deviceType.toString() : null,
    screenDimensions: {
      width,
      height,
      scale,
      fontScale,
    },
    appVersion: __DEV__ ? 'Development' : 'Production',
    buildNumber: null, // Would come from app.json or Constants
  };
}

/**
 * Format device info as string
 */
export function formatDeviceInfo(): string {
  const info = getDeviceInfo();
  return `
Platform: ${info.platform} ${info.osVersion}
Device: ${info.deviceName || 'Unknown'} (${info.deviceType || 'Unknown'})
Screen: ${info.screenDimensions.width}x${info.screenDimensions.height} @${info.screenDimensions.scale}x
Font Scale: ${info.screenDimensions.fontScale.toFixed(2)}x
App Version: ${info.appVersion}
  `.trim();
}
