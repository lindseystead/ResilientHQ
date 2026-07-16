/**
 * useScaleAnimation
 *
 * Scale animations with spring or timing. Good for pop-in effects, button presses, etc.
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  WithSpringConfig,
  Easing,
} from 'react-native-reanimated';
import { useEffect, useCallback, useMemo } from 'react';

export interface UseScaleAnimationOptions {
  initialScale?: number;
  targetScale?: number;
  delay?: number;
  useSpring?: boolean;
  springConfig?: WithSpringConfig;
  duration?: number;
  autoStart?: boolean;
}

export const useScaleAnimation = (options: UseScaleAnimationOptions = {}) => {
  const {
    initialScale = 0,
    targetScale = 1,
    delay = 0,
    useSpring = true,
    springConfig = {
      damping: 12,
      stiffness: 180,
      mass: 1,
      overshootClamping: false,
    },
    duration = 600,
    autoStart = true,
  } = options;

  const scale = useSharedValue(initialScale);

  // Spring config is often passed as inline object, so we need to memoize it
  // to avoid recreating the animation on every render
  const memoizedSpringConfig = useMemo(() => springConfig, [springConfig]);

  // Single source of truth for animation creation - used by autoStart, scaleTo, and reset
  const createAnimation = useCallback(
    (toValue: number) => {
      const baseAnimation = useSpring
        ? withSpring(toValue, memoizedSpringConfig)
        : withTiming(toValue, {
            duration,
            easing: Easing.out(Easing.cubic),
          });

      return delay > 0 ? withDelay(delay, baseAnimation) : baseAnimation;
    },
    [useSpring, memoizedSpringConfig, duration, delay],
  );

  useEffect(() => {
    if (autoStart) {
      scale.value = createAnimation(targetScale);
    }
  }, [autoStart, createAnimation, scale, targetScale]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: scale.value }],
    }),
    [],
  );

  const scaleTo = useCallback(
    (toScale: number) => {
      scale.value = createAnimation(toScale);
    },
    [scale, createAnimation],
  );

  const reset = useCallback(() => {
    scale.value = createAnimation(initialScale);
  }, [scale, createAnimation, initialScale]);

  return {
    scale,
    animatedStyle,
    scaleTo,
    reset,
  };
};
