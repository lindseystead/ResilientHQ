/**
 * Scaling Utilities
 *
 * Provides functions for scaling dimensions based on screen size.
 * Ensures consistent sizing across different device sizes while maintaining
 * visual hierarchy and readability. Follows mobile-first approach.
 * Optimized for performance with proper memoization support.
 */

import { Dimensions, PixelRatio } from 'react-native';

// Get initial dimensions (will be updated dynamically in hooks)
const getInitialDimensions = () => Dimensions.get('window');
const { width: INITIAL_WIDTH } = getInitialDimensions();

/**
 * Base width for scaling calculations (iPhone 6/7/8 width - mobile-first)
 */
const BASE_WIDTH = 375;

/**
 * Base height for scaling calculations (iPhone 6/7/8 height - mobile-first)
 */
/**
 * Maximum font scale multiplier for accessibility
 * Prevents text from becoming unreadably large
 */
const MAX_FONT_SCALE = 1.5;

/**
 * Minimum font scale multiplier for accessibility
 * Ensures text remains readable on small devices
 */
const MIN_FONT_SCALE = 0.85;

/**
 * Maximum scale factor for web/large screens
 * Prevents elements from becoming excessively large on wide screens
 */
const MAX_SCALE_FACTOR = 1.5;

/**
 * Scale a size based on screen width (mobile-first)
 *
 * Scales proportionally to screen width, maintaining aspect ratio.
 * Uses mobile-first approach: scales up from base mobile size.
 * Useful for widths, horizontal spacing, and font sizes.
 *
 * @param size - Base size to scale
 * @param width - Optional screen width (defaults to current screen width)
 * @returns Scaled size (rounded to nearest integer)
 *
 * @example
 * scale(16) // Returns scaled 16px based on screen width
 */
export const scale = (size: number, width?: number): number => {
  const currentWidth = width ?? INITIAL_WIDTH;
  const rawScaleFactor = currentWidth / BASE_WIDTH;
  // Cap scale factor to prevent excessive scaling on large screens/web
  const scaleFactor = Math.min(rawScaleFactor, MAX_SCALE_FACTOR);
  return Math.round(size * scaleFactor);
};

/**
 * Moderate scale with configurable factor (mobile-first)
 *
 * Provides a balanced scaling approach that prevents elements from
 * becoming too large on big screens or too small on small screens.
 * The factor parameter controls the scaling intensity (0-1).
 * Uses mobile-first approach.
 *
 * @param size - Base size to scale
 * @param factor - Scaling factor (0-1). Default: 0.5
 *                 0 = no scaling, 1 = full scaling
 * @param width - Optional screen width (defaults to current screen width)
 * @returns Moderately scaled size (rounded to nearest integer)
 *
 * @example
 * moderateScale(16, 0.5) // Returns moderately scaled 16px
 * moderateScale(16, 0.3) // Less aggressive scaling
 * moderateScale(16, 0.7) // More aggressive scaling
 */
export const moderateScale = (size: number, factor: number = 0.5, width?: number): number => {
  const currentWidth = width ?? INITIAL_WIDTH;
  const rawScaleFactor = currentWidth / BASE_WIDTH;
  // Cap scale factor to prevent excessive scaling on large screens/web
  const scaleFactor = Math.min(rawScaleFactor, MAX_SCALE_FACTOR);
  const moderateFactor = 1 + (scaleFactor - 1) * factor;
  return Math.round(size * moderateFactor);
};

/**
 * Scale font size with enhanced accessibility support
 *
 * Scales font size based on screen width and respects system font scale
 * settings for accessibility. Includes bounds checking to prevent
 * text from becoming unreadably large or too small.
 * Supports dynamic type / large text accessibility scaling.
 *
 * @param size - Base font size
 * @param factor - Optional scaling factor (default: 0.5)
 * @param width - Optional screen width (defaults to current screen width)
 * @returns Scaled font size respecting accessibility settings with bounds
 *
 * @example
 * scaleFont(16) // Returns scaled font size with accessibility support
 * scaleFont(16, 0.3, 414) // Custom scaling with specific width
 */
export const scaleFont = (size: number, factor: number = 0.5, width?: number): number => {
  // Get system font scale (respects accessibility settings)
  const systemFontScale = PixelRatio.getFontScale();

  // Clamp font scale to reasonable bounds for accessibility
  const clampedFontScale = Math.max(MIN_FONT_SCALE, Math.min(MAX_FONT_SCALE, systemFontScale));

  // Calculate base scaling from screen width
  const currentWidth = width ?? INITIAL_WIDTH;
  const rawScaleFactor = currentWidth / BASE_WIDTH;
  // Cap scale factor to prevent excessive scaling on large screens/web
  const scaleFactor = Math.min(rawScaleFactor, MAX_SCALE_FACTOR);
  const moderateFactor = 1 + (scaleFactor - 1) * factor;

  // Apply both screen scaling and accessibility scaling
  const scaledSize = size * moderateFactor * clampedFontScale;

  // Round to nearest integer for pixel-perfect rendering
  return Math.round(scaledSize);
};
