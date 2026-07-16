/**
 * Responsive Dimensions
 *
 * Centralized dimension constants and utilities for consistent spacing and sizing.
 * Uses a mobile-first approach with scaling for larger screens.
 * Includes support for large-screen layouts with max content width.
 * All functions are optimized for performance and handle orientation changes.
 */

import { spacing as themeSpacing } from '@/src/config/theme';
import { Dimensions } from 'react-native';
import { isFoldable, isTablet } from './deviceType';
import { moderateScale, scale } from './scale';

/**
 * Spacing scale following 4px grid system
 *
 * Kept for backward compatibility in older layout code.
 * New code should read directly from theme.spacing.
 */
export const SPACING = {
  xs: themeSpacing.xs, // 4
  sm: themeSpacing.sm, // 8
  md: themeSpacing.md, // 12
  base: themeSpacing.lg, // legacy alias
  lg: themeSpacing.lg,
  xl: themeSpacing.xl, // 24
  xxl: themeSpacing['2xl'], // 32
  xxxl: themeSpacing['3xl'], // 48
} as const;

/**
 * Maximum content width for large screens
 * Content will be centered on tablets and foldables
 */
export const MAX_CONTENT_WIDTH = 720;

/**
 * Get current screen dimensions (dynamic)
 *
 * Returns current screen dimensions, updating on orientation changes.
 * Use this instead of module-level constants for dynamic layouts.
 *
 * @returns Current screen dimensions object
 */
export const getScreenDimensions = () => {
  return Dimensions.get('window');
};

/**
 * Common component dimensions
 * All dimensions are scaled appropriately for different screen sizes
 * Note: These use initial dimensions. For dynamic scaling, use scale() functions directly.
 */
export const DIMENSIONS = {
  // Buttons
  buttonHeight: scale(48),
  buttonHeightSmall: scale(40),
  buttonHeightLarge: scale(56),

  // Inputs
  inputHeight: scale(48),
  inputPadding: scale(16),

  // Cards
  cardPadding: moderateScale(20),
  cardBorderRadius: moderateScale(16),
  cardElevation: 4,

  // Icons
  iconSize: scale(24),
  iconSizeSmall: scale(20),
  iconSizeLarge: scale(32),

  // Avatar
  avatarSize: scale(40),
  avatarSizeSmall: scale(32),
  avatarSizeLarge: scale(64),

  // Logo
  logoSize: Math.min(Dimensions.get('window').height * 0.42, 320),
  logoSizeMin: 180,
} as const;

/**
 * Get centered content width for large screens (dynamic)
 *
 * Returns the appropriate width for content on large screens.
 * On tablets and foldables, content is centered with max width.
 * On phones, uses full width.
 * Handles orientation changes dynamically.
 *
 * @param width - Current screen width (optional, uses current if not provided)
 * @returns Content width in pixels
 *
 * @example
 * getContentWidth() // Returns content width based on current screen
 * getContentWidth(1024) // Returns content width for specific width
 */
export const getContentWidth = (width?: number): number => {
  const currentWidth = width ?? getScreenDimensions().width;
  const isTabletDevice = isTablet();
  const isFoldableDevice = isFoldable();

  if (isTabletDevice || isFoldableDevice) {
    return Math.min(currentWidth, MAX_CONTENT_WIDTH);
  }
  return currentWidth;
};

/**
 * Get horizontal padding for centered content (dynamic)
 *
 * Calculates the horizontal padding needed to center content
 * on large screens with max content width.
 * Handles orientation changes dynamically.
 *
 * @param width - Current screen width (optional, uses current if not provided)
 * @returns Horizontal padding in pixels
 *
 * @example
 * getContentPadding() // Returns padding based on current screen
 * getContentPadding(1024) // Returns padding for specific width
 */
export const getContentPadding = (width?: number): number => {
  const currentWidth = width ?? getScreenDimensions().width;
  const isTabletDevice = isTablet();
  const isFoldableDevice = isFoldable();

  if (isTabletDevice || isFoldableDevice) {
    const contentWidth = getContentWidth(currentWidth);
    return Math.max(0, (currentWidth - contentWidth) / 2);
  }
  return 0;
};
