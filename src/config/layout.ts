/**
 * Shared layout constants and helpers.
 *
 * Feature modules should import layout primitives from this file
 * instead of importing navigator internals.
 */

import { spacing } from '@/src/config/theme';

export const TAB_BAR_HEIGHT = 60;

export const getTabBarSafeAreaPadding = (
  bottomInset: number,
  minimumInset: number = spacing.sm,
): number => TAB_BAR_HEIGHT + Math.max(bottomInset, minimumInset);
