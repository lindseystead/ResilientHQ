/**
 * useResponsive Hook
 *
 * Responsive design hook that provides utilities for
 * responsive layouts, typography, spacing, and device detection.
 * Includes accessibility-aware font scaling and safe area support.
 * Optimized for performance with proper memoization and orientation change handling.
 */

import { useWindowDimensions, PixelRatio } from 'react-native';
import { useMemo, useCallback } from 'react';
import { scale, moderateScale, scaleFont } from './scale';
import { isTablet, isFoldable } from './deviceType';
import { useInsets } from './insets';
import { getContentWidth, getContentPadding } from './dimensions';

/**
 * Responsive utilities return type
 */
export interface UseResponsiveReturn {
  // Dimensions
  width: number;
  height: number;

  // Scaling functions
  scaleFont: (size: number, factor?: number) => number;
  scaleSpacing: (size: number) => number;

  // Percentage helpers
  getWidth: (percentage: number) => number;
  getHeight: (percentage: number) => number;

  // Layout helpers
  isLandscape: boolean;
  isTablet: boolean;
  isFoldable: boolean;

  // Safe area insets
  insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };

  // Large screen layout (dynamic, updates on orientation change)
  contentWidth: number;
  contentPadding: number;

  // Pixel ratio and accessibility
  pixelRatio: number;
  fontScale: number; // Accessibility font scale
}

/**
 * useResponsive Hook
 *
 * Provides responsive utilities for building adaptive layouts.
 * All scaling functions respect accessibility settings and device characteristics.
 * Handles orientation changes smoothly with proper memoization.
 *
 * @returns Responsive utilities object
 *
 * @example
 * const { width, scaleFont, isTablet, insets, contentWidth } = useResponsive();
 *
 * <Text style={{ fontSize: scaleFont(16) }}>
 *   Responsive text
 * </Text>
 *
 * <View style={{
 *   paddingTop: insets.top,
 *   width: contentWidth,
 *   paddingHorizontal: contentPadding
 * }}>
 *   Safe area content
 * </View>
 */
export const useResponsive = (): UseResponsiveReturn => {
  const { width, height } = useWindowDimensions(); // Automatically updates on orientation change
  const pixelRatio = PixelRatio.get();
  const fontScale = PixelRatio.getFontScale(); // Accessibility font scale
  const insets = useInsets();

  // Device detection (memoized to avoid recalculation)
  const deviceIsTablet = useMemo(() => isTablet(), []);
  const deviceIsFoldable = useMemo(() => isFoldable(), []);
  const isLandscape = useMemo(() => width > height, [width, height]);

  // Scaling functions with memoization (depend on width for orientation changes)
  const scaleFontMemo = useCallback(
    (size: number, factor: number = 0.5) => {
      return scaleFont(size, factor, width);
    },
    [width], // Updates when width changes (orientation change)
  );

  const scaleSpacingMemo = useCallback(
    (spacing: number): number => {
      if (deviceIsTablet) {
        return moderateScale(spacing, 0.5, width);
      }
      return scale(spacing, width);
    },
    [deviceIsTablet, width], // Updates when width changes
  );

  // Percentage helpers (memoized, update on dimension changes)
  const getWidth = useCallback(
    (percentage: number): number => {
      return (width * percentage) / 100;
    },
    [width],
  );

  const getHeight = useCallback(
    (percentage: number): number => {
      return (height * percentage) / 100;
    },
    [height],
  );

  // Large screen layout (dynamic, updates on orientation change)
  const contentWidth = useMemo(
    () => getContentWidth(width),
    [width], // Updates when width changes (orientation change)
  );

  const contentPadding = useMemo(
    () => getContentPadding(width),
    [width], // Updates when width changes (orientation change)
  );

  // Main return object (memoized for performance)
  return useMemo(
    () => ({
      width,
      height,
      scaleFont: scaleFontMemo,
      scaleSpacing: scaleSpacingMemo,
      getWidth,
      getHeight,
      isLandscape,
      isTablet: deviceIsTablet,
      isFoldable: deviceIsFoldable,
      insets,
      contentWidth,
      contentPadding,
      pixelRatio,
      fontScale, // Expose accessibility font scale
    }),
    [
      width,
      height,
      scaleFontMemo,
      scaleSpacingMemo,
      getWidth,
      getHeight,
      isLandscape,
      deviceIsTablet,
      deviceIsFoldable,
      insets,
      contentWidth,
      contentPadding,
      pixelRatio,
      fontScale,
    ],
  );
};
