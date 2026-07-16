/**
 * Standardized Floating Action Button
 *
 * Unified FAB design across the entire app.
 * Standards:
 * - size: 56×56
 * - radius: 28
 * - bottom: insets.bottom + 16 (theme.spacing.md)
 * - right: 16 (theme.spacing.md)
 * - backgroundColor: theme.colors.accent
 * - shadow: theme.elevation.high
 */

import React, { useContext } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';
import { useMountSpring } from '@/src/shared/hooks/animation/useMountSpring';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export interface FloatingActionButtonProps {
  /**
   * Icon name from Ionicons
   */
  icon: keyof typeof Ionicons.glyphMap;
  /**
   * Callback when button is pressed
   */
  onPress: () => void;
  /**
   * Button background color override (default: theme.colors.accent)
   */
  backgroundColor?: string;
  /**
   * Icon color override (default: theme.colors.white)
   */
  iconColor?: string;
  /**
   * Icon size (default: 28)
   */
  iconSize?: number;
  /**
   * Custom style
   */
  style?: ViewStyle;
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
  /**
   * Accessibility hint
   */
  accessibilityHint?: string;
}

const FAB_SIZE = 56; // Minimum 44px for accessibility, using 56px for better visibility
const FAB_RADIUS = 28; // Half of FAB_SIZE for circular button
const FAB_ICON_SIZE = 28;

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onPress,
  backgroundColor,
  iconColor,
  iconSize = FAB_ICON_SIZE,
  style,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme } = useTheme();
  const { scaleSpacing } = useResponsive();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;

  // Position above tab bar + safe area
  const bottom = tabBarHeight + Math.max(insets.bottom, scaleSpacing(theme.spacing.lg));
  const right = scaleSpacing(theme.spacing.lg);
  const size = scaleSpacing(FAB_SIZE);
  const radius = scaleSpacing(FAB_RADIUS);

  // FAB spring pop animation on mount
  const { animatedStyle: mountAnimation } = useMountSpring({
    delay: 200,
    initialScale: 0,
    targetScale: 1,
  });

  return (
    <AnimatedTouchable
      style={[
        styles.fab,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: backgroundColor || theme.colors.accent,
          bottom,
          right,
          ...theme.elevation.high,
        },
        mountAnimation,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <Ionicons name={icon} size={iconSize} color={iconColor || theme.colors.white} />
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});

export default FloatingActionButton;
