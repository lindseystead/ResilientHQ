/**
 * Shimmer Loader Component
 *
 * Provides shimmer loading placeholder animation.
 * Used for loading states in lists and cards.
 */

import { useTheme } from '@/src/providers/ThemeProvider';
import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export interface ShimmerLoaderProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const ShimmerLoader: React.FC<ShimmerLoaderProps> = ({
  width,
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { theme } = useTheme();
  const shimmerOpacity = useSharedValue(0.3);

  useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, [shimmerOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  const containerStyle: ViewStyle = {
    height,
    borderRadius,
    backgroundColor: theme.colors.border2,
    ...(width !== undefined ? { width } : { flex: 1 }),
  };

  return <Animated.View style={[styles.shimmer, containerStyle, animatedStyle, style]} />;
};

const styles = StyleSheet.create({
  shimmer: {
    overflow: 'hidden',
  },
});
