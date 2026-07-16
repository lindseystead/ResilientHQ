/**
 * useMountSpring
 *
 * Spring animation for components mounting (e.g., FAB pop-in).
 * Provides bouncy, natural-feeling entrance animation.
 */

import { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { useEffect, useMemo } from 'react';

export interface UseMountSpringOptions {
  delay?: number;
  initialScale?: number;
  targetScale?: number;
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
    overshootClamping?: boolean;
  };
}

export const useMountSpring = (options: UseMountSpringOptions = {}) => {
  const {
    delay = 0,
    initialScale = 0,
    targetScale = 1,
    springConfig = {
      damping: 12,
      stiffness: 180,
      mass: 1,
      overshootClamping: false,
    },
  } = options;

  const scale = useSharedValue(initialScale);
  const opacity = useSharedValue(0);

  // Memoize spring config to prevent recreating animation on every render
  const memoizedConfig = useMemo(
    () => ({
      damping: springConfig.damping ?? 12,
      stiffness: springConfig.stiffness ?? 180,
      mass: springConfig.mass ?? 1,
      overshootClamping: springConfig.overshootClamping ?? false,
    }),
    [
      springConfig.damping,
      springConfig.stiffness,
      springConfig.mass,
      springConfig.overshootClamping,
    ],
  );

  useEffect(() => {
    // Initialize values
    scale.value = initialScale;
    opacity.value = 0;

    // Create animations
    const springAnimation = withSpring(targetScale, memoizedConfig);
    const opacityAnimation = withSpring(1, memoizedConfig);

    // Apply animations with optional delay
    if (delay > 0) {
      scale.value = withDelay(delay, springAnimation);
      opacity.value = withDelay(delay, opacityAnimation);
    } else {
      scale.value = springAnimation;
      opacity.value = opacityAnimation;
    }
  }, [delay, initialScale, memoizedConfig, opacity, scale, targetScale]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }),
    [],
  );

  return {
    animatedStyle,
    scale,
    opacity,
  };
};
