/**
 * useScreenTransition
 *
 * Screen transition animations - fade, slide left/right/up/down.
 * Used for page transitions, modal entrances, etc.
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useEffect, useMemo } from 'react';

export type TransitionType = 'fade' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown';

export interface UseScreenTransitionOptions {
  type?: TransitionType;
  duration?: number;
  delay?: number;
  autoStart?: boolean;
}

export const useScreenTransition = (options: UseScreenTransitionOptions = {}) => {
  const { type = 'fade', duration = 300, delay = 0, autoStart = true } = options;

  // Calculate initial positions based on transition type
  // e.g., slideLeft starts at -50, then animates to 0
  const initialTranslateX = useMemo(() => {
    if (type === 'slideLeft') return -50;
    if (type === 'slideRight') return 50;
    return 0;
  }, [type]);

  const initialTranslateY = useMemo(() => {
    if (type === 'slideUp') return -50;
    if (type === 'slideDown') return 50;
    return 0;
  }, [type]);

  const opacity = useSharedValue(autoStart ? 0 : 1);
  const translateX = useSharedValue(initialTranslateX);
  const translateY = useSharedValue(initialTranslateY);

  // Memoize timing config to avoid recreating animation objects
  const timingConfig = useMemo(
    () => ({
      duration,
      easing: Easing.out(Easing.cubic),
    }),
    [duration],
  );

  useEffect(() => {
    if (!autoStart) {
      opacity.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      return;
    }

    opacity.value = 0;
    translateX.value = initialTranslateX;
    translateY.value = initialTranslateY;

    const animation = withTiming(1, timingConfig);
    const translateXAnimation = withTiming(0, timingConfig);
    const translateYAnimation = withTiming(0, timingConfig);

    if (delay > 0) {
      opacity.value = withDelay(delay, animation);
      translateX.value = withDelay(delay, translateXAnimation);
      translateY.value = withDelay(delay, translateYAnimation);
    } else {
      opacity.value = animation;
      translateX.value = translateXAnimation;
      translateY.value = translateYAnimation;
    }
  }, [
    autoStart,
    delay,
    initialTranslateX,
    initialTranslateY,
    opacity,
    timingConfig,
    translateX,
    translateY,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    // Only add transforms for slide transitions
    if (type === 'slideLeft' || type === 'slideRight') {
      return {
        opacity: opacity.value,
        transform: [{ translateX: translateX.value }],
      };
    } else if (type === 'slideUp' || type === 'slideDown') {
      return {
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
      };
    }

    return {
      opacity: opacity.value,
    };
  }, [type]);

  return {
    animatedStyle,
    opacity,
    translateX,
    translateY,
  };
};
