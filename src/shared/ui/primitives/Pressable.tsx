/**
 * Pressable Component
 *
 * Enhanced TouchableOpacity with scale animation.
 * Use for any interactive element that needs press feedback.
 */

import React, { memo, ReactNode } from 'react';
import { TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export interface PressableProps {
  children: ReactNode;
  /** Press handler */
  onPress: () => void;
  /** Scale amount on press (default: 0.97) */
  pressScale?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Custom style - supports arrays */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label */
  accessibilityLabel?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const Pressable: React.FC<PressableProps> = memo(
  ({ children, onPress, pressScale = 0.97, disabled = false, style, accessibilityLabel }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(pressScale, { damping: 20, stiffness: 300 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    };

    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[animatedStyle, style]}
      >
        {children}
      </AnimatedTouchable>
    );
  },
);

Pressable.displayName = 'Pressable';
export default Pressable;
