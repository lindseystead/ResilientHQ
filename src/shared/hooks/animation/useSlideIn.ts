/**
 * useSlideIn
 *
 * Slide-in animation hook for components entering from left/right/top/bottom.
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

export type SlideDirection = 'left' | 'right' | 'top' | 'bottom';

export interface UseSlideInOptions {
  direction?: SlideDirection;
  duration?: number;
  delay?: number;
  distance?: number;
  autoStart?: boolean;
  respectReducedMotion?: boolean;
}

export const useSlideIn = (options: UseSlideInOptions = {}) => {
  const {
    direction = 'left',
    duration = 350,
    delay = 0,
    distance = 50,
    autoStart = true,
    respectReducedMotion = true,
  } = options;

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (respectReducedMotion && Platform.OS !== 'web') {
      AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    }
  }, [respectReducedMotion]);

  const getInitialTranslate = useMemo(() => {
    if (reducedMotion) return { translateX: 0, translateY: 0 };

    switch (direction) {
      case 'left':
        return { translateX: -distance, translateY: 0 };
      case 'right':
        return { translateX: distance, translateY: 0 };
      case 'top':
        return { translateX: 0, translateY: -distance };
      case 'bottom':
        return { translateX: 0, translateY: distance };
      default:
        return { translateX: 0, translateY: 0 };
    }
  }, [direction, distance, reducedMotion]);

  const translateX = useSharedValue(getInitialTranslate.translateX);
  const translateY = useSharedValue(getInitialTranslate.translateY);
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  const timingConfig = useMemo(
    () => ({
      duration: reducedMotion ? 0 : duration,
      easing: Easing.out(Easing.cubic),
    }),
    [duration, reducedMotion],
  );

  useEffect(() => {
    translateX.value = getInitialTranslate.translateX;
    translateY.value = getInitialTranslate.translateY;
    opacity.value = reducedMotion ? 1 : 0;

    if (!autoStart) return;

    const animation = withTiming(0, timingConfig);
    const opacityAnimation = withTiming(1, timingConfig);

    if (delay > 0) {
      translateX.value = withDelay(delay, animation);
      translateY.value = withDelay(delay, animation);
      opacity.value = withDelay(delay, opacityAnimation);
    } else {
      translateX.value = animation;
      translateY.value = animation;
      opacity.value = opacityAnimation;
    }
  }, [
    autoStart,
    delay,
    getInitialTranslate,
    opacity,
    reducedMotion,
    timingConfig,
    translateX,
    translateY,
  ]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: opacity.value,
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    }),
    [],
  );

  return {
    animatedStyle,
    translateX,
    translateY,
    opacity,
  };
};
