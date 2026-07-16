/**
 * Responsive Design Utilities Module
 *
 * Responsive design system for React Native.
 * Provides scaling, breakpoints, device detection, and layout utilities.
 * Tree-shakeable and optimized for performance.
 */

// Scaling utilities
export { moderateScale, scale, scaleFont } from './scale';

// Device type detection
export { isFoldable, isTablet } from './deviceType';
export type { DeviceType } from './deviceType';

// Safe area insets
export { useInsets } from './insets';
export type { SafeAreaInsets } from './insets';

// Dimensions and spacing
export {
  DIMENSIONS,
  getContentPadding,
  getContentWidth,
  MAX_CONTENT_WIDTH,
  SPACING,
} from './dimensions';

// Hooks
export { useResponsive } from './useResponsive';
export type { UseResponsiveReturn } from './useResponsive';
