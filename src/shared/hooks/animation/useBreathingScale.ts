/**
 * useBreathingScale
 *
 * Drives the expand / hold / contract scale animation for a single guided
 * breathing step. Extracted so the chatbot and Help breathing views share one
 * timing source while keeping their own distinct presentation.
 *
 * The step "cycle": expand to 1.3 immediately, contract back to 1 at the
 * half-way point, then invoke `onStepComplete` once the full step has elapsed.
 */

import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

// Reanimated's default `overshootClamping` is already `false`; it is stated
// explicitly here so the shared behaviour is unambiguous.
const BREATHING_SPRING = {
  damping: 12,
  stiffness: 180,
  mass: 1,
  overshootClamping: false,
} as const;

/**
 * @param currentStep       Index of the active breathing step. Changing it
 *                          re-triggers the cycle.
 * @param stepDurationMs    Full duration of the step in milliseconds. When
 *                          `undefined` (e.g. the index is past the end of the
 *                          sequence) the animation is skipped.
 * @param onStepComplete    Called once the step's cycle has finished.
 * @returns An animated style applying the current scale transform.
 */
export const useBreathingScale = (
  currentStep: number,
  stepDurationMs: number | undefined,
  onStepComplete: () => void,
) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (stepDurationMs === undefined) {
      return;
    }

    scale.value = withSpring(1.3, BREATHING_SPRING);

    let completionTimeout: ReturnType<typeof setTimeout> | null = null;
    const timer = setTimeout(() => {
      scale.value = withSpring(1, BREATHING_SPRING);
      completionTimeout = setTimeout(onStepComplete, stepDurationMs);
    }, stepDurationMs / 2);

    return () => {
      clearTimeout(timer);
      if (completionTimeout) {
        clearTimeout(completionTimeout);
      }
    };
  }, [currentStep, stepDurationMs, onStepComplete, scale]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
};
