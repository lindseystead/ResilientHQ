/**
 * useFadeAnimation
 *
 * Fade in/out animation hook with manual controls. Useful for modals, overlays, etc.
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useEffect, useCallback, useMemo } from 'react';

export interface UseFadeAnimationOptions {
  initialOpacity?: number;
  targetOpacity?: number;
  duration?: number;
  delay?: number;
  autoStart?: boolean;
  easing?: (value: number) => number;
}

export const useFadeAnimation = (options: UseFadeAnimationOptions = {}) => {
  const {
    initialOpacity = 0,
    targetOpacity = 1,
    duration = 350,
    delay = 0,
    autoStart = true,
    easing = Easing.out(Easing.cubic),
  } = options;

  const opacity = useSharedValue(initialOpacity);

  // Memoize easing function since it's often passed inline and would cause re-renders
  const easingFunction = useMemo(() => easing, [easing]);

  useEffect(() => {
    if (!autoStart) return;

    const animation = withTiming(targetOpacity, { duration, easing: easingFunction });
    opacity.value = delay > 0 ? withDelay(delay, animation) : animation;
  }, [autoStart, delay, duration, easingFunction, opacity, targetOpacity]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: opacity.value,
    }),
    [],
  );

  const fadeIn = useCallback(
    (toOpacity?: number) => {
      opacity.value = withTiming(toOpacity ?? targetOpacity, {
        duration,
        easing: easingFunction,
      });
    },
    [opacity, targetOpacity, duration, easingFunction],
  );

  const fadeOut = useCallback(
    (toOpacity?: number) => {
      opacity.value = withTiming(toOpacity ?? initialOpacity, {
        duration,
        easing: easingFunction,
      });
    },
    [opacity, initialOpacity, duration, easingFunction],
  );

  return {
    opacity,
    animatedStyle,
    fadeIn,
    fadeOut,
  };
};
