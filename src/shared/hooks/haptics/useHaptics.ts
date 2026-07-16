/**
 * Haptic Feedback Hook
 *
 * Centralized haptic feedback utilities for consistent user experience.
 * Provides typed haptic feedback functions for different interaction types.
 */

import * as Haptics from 'expo-haptics';

/**
 * Haptic Feedback Types
 */
export type HapticStyle = 'light' | 'medium' | 'heavy';
export type HapticNotification = 'success' | 'warning' | 'error';

/**
 * Haptic Feedback Hook
 * Provides consistent haptic feedback throughout the app
 */
export const useHaptics = () => {
  /**
   * Impact feedback for button presses and interactions
   */
  const impact = async (style: HapticStyle = 'light') => {
    try {
      const hapticStyle =
        style === 'light'
          ? Haptics.ImpactFeedbackStyle.Light
          : style === 'medium'
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Heavy;

      await Haptics.impactAsync(hapticStyle);
    } catch {
      // Haptics may not be available on all devices or blocked by browser
      // Silently fail to avoid console noise
    }
  };

  /**
   * Notification feedback for success, warning, or error states
   */
  const notification = async (type: HapticNotification) => {
    try {
      const notificationType =
        type === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : type === 'warning'
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Error;

      await Haptics.notificationAsync(notificationType);
    } catch {
      // Haptics may not be available on all devices or blocked by browser
      // Silently fail to avoid console noise
    }
  };

  /**
   * Selection feedback for picker changes and selections
   */
  const selection = async () => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Haptics may not be available on all devices or blocked by browser
      // Silently fail to avoid console noise
    }
  };

  /**
   * Long press haptic feedback
   */
  const longPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Haptics may not be available on all devices or blocked by browser
      // Silently fail to avoid console noise
    }
  };

  /**
   * Tab change haptic feedback
   */
  const tabChange = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics may not be available on all devices or blocked by browser
      // Silently fail to avoid console noise
    }
  };

  return {
    impact,
    notification,
    selection,
    longPress,
    tabChange,
  };
};

/**
 * Convenience functions for direct use without hook
 * These directly use Haptics API without requiring the hook
 */
export const hapticImpact = async (style: HapticStyle = 'light') => {
  try {
    const hapticStyle =
      style === 'light'
        ? Haptics.ImpactFeedbackStyle.Light
        : style === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Heavy;
    await Haptics.impactAsync(hapticStyle);
  } catch {
    // Haptics may not be available on all devices or blocked by browser
    // Silently fail to avoid console noise
  }
};

export const hapticNotification = async (type: HapticNotification) => {
  try {
    const notificationType =
      type === 'success'
        ? Haptics.NotificationFeedbackType.Success
        : type === 'warning'
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Error;
    await Haptics.notificationAsync(notificationType);
  } catch {
    // Haptics may not be available on all devices or blocked by browser
    // Silently fail to avoid console noise
  }
};

export const hapticSelection = async () => {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptics may not be available on all devices or blocked by browser
    // Silently fail to avoid console noise
  }
};
