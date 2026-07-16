/**
 * Safe Area Insets
 *
 * Provides safe area insets for handling notches, dynamic islands,
 * and bottom safe areas. Includes fallbacks for devices without
 * react-native-safe-area-context.
 */

import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Safe area insets interface
 */
export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Get default safe area insets (fallback)
 *
 * Provides platform-specific default insets when safe area context
 * is not available. Uses heuristics based on device characteristics.
 *
 * @returns Default safe area insets
 */
export const getDefaultInsets = (): SafeAreaInsets => {
  // iOS notch/Dynamic Island detection (approximate)
  const hasNotch = Platform.OS === 'ios' && (SCREEN_HEIGHT >= 812 || SCREEN_WIDTH >= 812); // iPhone X and later

  // Android navigation bar height (approximate)
  const androidNavBarHeight = Platform.OS === 'android' ? 48 : 0;

  return {
    top: hasNotch ? 44 : Platform.OS === 'ios' ? 20 : 0, // Status bar + notch
    bottom: hasNotch ? 34 : Platform.OS === 'android' ? androidNavBarHeight : 0, // Home indicator / nav bar
    left: 0,
    right: 0,
  };
};

/**
 * Hook to get safe area insets
 *
 * Uses react-native-safe-area-context when available, falls back
 * to default insets for compatibility.
 *
 * @returns Safe area insets object
 *
 * @example
 * const insets = useInsets();
 * <View style={{ paddingTop: insets.top }} />
 */
export const useInsets = (): SafeAreaInsets => {
  try {
    const insets = useSafeAreaInsets();
    return {
      top: insets.top,
      bottom: insets.bottom,
      left: insets.left,
      right: insets.right,
    };
  } catch {
    // Fallback if safe area context is not available
    return getDefaultInsets();
  }
};
