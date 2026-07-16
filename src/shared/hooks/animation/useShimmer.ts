/**
 * useShimmer
 *
 * Shimmer animation hook for skeleton loaders.
 * Provides smooth opacity pulsing effect.
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export interface UseShimmerOptions {
  minOpacity?: number;
  maxOpacity?: number;
  duration?: number;
  autoStart?: boolean;
}

export const useShimmer = (options: UseShimmerOptions = {}) => {
  const { minOpacity = 0.3, maxOpacity = 1, duration = 1000, autoStart = true } = options;

  const opacity = useSharedValue(minOpacity);

  useEffect(() => {
    if (!autoStart) return;

    opacity.value = withRepeat(
      withSequence(
        withTiming(maxOpacity, {
          duration: duration,
          easing: Easing.inOut(Easing.cubic),
        }),
        withTiming(minOpacity, {
          duration: duration,
          easing: Easing.inOut(Easing.cubic),
        }),
      ),
      -1,
      false,
    );
  }, [autoStart, duration, maxOpacity, minOpacity, opacity]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: opacity.value,
    }),
    [],
  );

  return {
    animatedStyle,
    opacity,
  };
};
