/**
 * Haptic Tab Component
 *
 * Provides haptic feedback for tab navigation buttons.
 * Uses native haptics on iOS for better user experience.
 */

import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
            // Silently fail if haptics are blocked or unavailable
          });
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
