/**
 * Animation Hooks Module
 *
 * Centralized animation utilities using React Native Reanimated.
 * All animations respect reduced motion accessibility settings.
 */

export { useBreathingScale } from './useBreathingScale';
export { useFadeAnimation } from './useFadeAnimation';
export type { UseFadeAnimationOptions } from './useFadeAnimation';
export { useMountSpring } from './useMountSpring';
export type { UseMountSpringOptions } from './useMountSpring';
export { useScaleAnimation } from './useScaleAnimation';
export type { UseScaleAnimationOptions } from './useScaleAnimation';
export { useScreenTransition } from './useScreenTransition';
export type { TransitionType, UseScreenTransitionOptions } from './useScreenTransition';
export { useShimmer } from './useShimmer';
export type { UseShimmerOptions } from './useShimmer';
export { useSlideIn } from './useSlideIn';
export type { SlideDirection, UseSlideInOptions } from './useSlideIn';
export { useStaggerList } from './useStaggerList';
export type { UseStaggerListOptions } from './useStaggerList';
