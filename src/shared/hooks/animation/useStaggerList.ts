/**
 * useStaggerList
 *
 * Staggered animation for list items - creates fade+rise effect with configurable delay.
 * Respects reduced motion accessibility setting.
 */

import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

export interface UseStaggerListOptions {
  index: number;
  staggerDelay?: number;
  duration?: number;
  initialDelay?: number;
  respectReducedMotion?: boolean;
}

export const useStaggerList = (options: UseStaggerListOptions) => {
  const {
    index,
    staggerDelay = 50,
    duration = 300,
    initialDelay = 0,
    respectReducedMotion = true,
  } = options;

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (respectReducedMotion && Platform.OS !== 'web') {
      AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    }
  }, [respectReducedMotion]);

  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 20);

  const totalDelay = useMemo(
    () => initialDelay + index * staggerDelay,
    [initialDelay, index, staggerDelay],
  );

  const timingConfig = useMemo(
    () => ({
      duration: reducedMotion ? 0 : duration,
      easing: Easing.out(Easing.cubic),
    }),
    [duration, reducedMotion],
  );

  useEffect(() => {
    const animation = withTiming(1, timingConfig);
    const translateAnimation = withTiming(0, timingConfig);

    opacity.value = totalDelay > 0 ? withDelay(totalDelay, animation) : animation;
    translateY.value =
      totalDelay > 0 ? withDelay(totalDelay, translateAnimation) : translateAnimation;
  }, [opacity, totalDelay, timingConfig, translateY]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    }),
    [],
  );

  return {
    animatedStyle,
    opacity,
    translateY,
  };
};
