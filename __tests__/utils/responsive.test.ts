/**
 * Responsive Utilities Tests
 *
 * Comprehensive tests for responsive design utilities including scaling,
 * font scaling, device detection, dimensions, and layout calculations.
 */

// Mock Dimensions before importing responsive utilities
jest.mock('react-native/Libraries/Utilities/Dimensions', () => {
  const dimensionsMock = {
    get: jest.fn(() => ({ width: 375, height: 812, scale: 2, fontScale: 2 })),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
  };
  return {
    ...dimensionsMock,
    default: dimensionsMock,
  };
});

import {
  DIMENSIONS,
  getContentPadding,
  getContentWidth,
  isFoldable,
  isTablet,
  MAX_CONTENT_WIDTH,
  moderateScale,
  scale,
  scaleFont,
  SPACING,
} from '@/src/shared/utils/responsive';

// ─── scale() ─────────────────────────────────────────────────────────────────

describe('scale', () => {
  it('should return the same value when width equals base width (375)', () => {
    // scale(10, 375) => 10 * (375/375) = 10 * 1 = 10
    expect(scale(10, 375)).toBe(10);
  });

  it('should scale up for larger widths', () => {
    // scale(10, 750) => 10 * min(750/375, 1.5) = 10 * 1.5 = 15 (capped)
    const result = scale(10, 750);
    expect(result).toBe(15);
  });

  it('should scale down for smaller widths', () => {
    // scale(10, 320) => 10 * (320/375) = 10 * 0.8533 ~ 9
    const result = scale(10, 320);
    expect(result).toBeLessThan(10);
  });

  it('should return 0 for zero input', () => {
    expect(scale(0)).toBe(0);
    expect(scale(0, 500)).toBe(0);
  });

  it('should handle negative values', () => {
    const result = scale(-10, 375);
    expect(result).toBe(-10);
  });

  it('should round to nearest integer', () => {
    // 10 * (400/375) = 10 * 1.0667 = 10.667 => rounds to 11
    const result = scale(10, 400);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('should cap scale factor at 1.5', () => {
    // scale(10, 1000) => 10 * min(1000/375, 1.5) = 10 * 1.5 = 15
    expect(scale(10, 1000)).toBe(15);
    // scale(10, 2000) => still capped at 1.5 => 15
    expect(scale(10, 2000)).toBe(15);
  });

  it('should use default width (375 from mock) when width not provided', () => {
    // With mocked width=375, scale factor = 375/375 = 1
    expect(scale(10)).toBe(10);
  });

  it('should handle large input sizes', () => {
    const result = scale(1000, 375);
    expect(result).toBe(1000);
  });

  it('should handle decimal input sizes', () => {
    const result = scale(10.5, 375);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('should handle very small widths', () => {
    const result = scale(10, 100);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(10);
  });
});

// ─── moderateScale() ─────────────────────────────────────────────────────────

describe('moderateScale', () => {
  it('should return the same value when width equals base width', () => {
    // moderateScale(10, 0.5, 375) => 10 * (1 + (1 - 1) * 0.5) = 10 * 1 = 10
    expect(moderateScale(10, 0.5, 375)).toBe(10);
  });

  it('should scale less aggressively than scale()', () => {
    const fullScale = scale(100, 500);
    const moderate = moderateScale(100, 0.5, 500);
    // Moderate scale should be between 100 and fullScale
    expect(moderate).toBeLessThanOrEqual(fullScale);
    expect(moderate).toBeGreaterThanOrEqual(100);
  });

  it('should return the original size when factor is 0', () => {
    // moderateScale(10, 0, 500) => 10 * (1 + (scaleFactor - 1) * 0) = 10 * 1 = 10
    expect(moderateScale(10, 0, 500)).toBe(10);
  });

  it('should behave like full scale when factor is 1', () => {
    const fullScale = scale(10, 500);
    const fullModerate = moderateScale(10, 1, 500);
    expect(fullModerate).toBe(fullScale);
  });

  it('should default factor to 0.5', () => {
    const withDefault = moderateScale(10, undefined, 500);
    const withExplicit = moderateScale(10, 0.5, 500);
    expect(withDefault).toBe(withExplicit);
  });

  it('should return 0 for zero input', () => {
    expect(moderateScale(0)).toBe(0);
  });

  it('should round to nearest integer', () => {
    const result = moderateScale(10, 0.5, 400);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('should cap the underlying scale factor at 1.5', () => {
    // For width=2000, rawScaleFactor=5.33, capped to 1.5
    // moderateScale(10, 0.5, 2000) => 10 * (1 + (1.5 - 1) * 0.5) = 10 * 1.25 = 13
    const result1 = moderateScale(10, 0.5, 2000);
    const result2 = moderateScale(10, 0.5, 3000);
    expect(result1).toBe(result2); // both capped
  });

  it('should handle negative input', () => {
    const result = moderateScale(-10, 0.5, 375);
    expect(result).toBe(-10);
  });
});

// ─── scaleFont() ─────────────────────────────────────────────────────────────

describe('scaleFont', () => {
  it('should return a positive number for positive input', () => {
    const result = scaleFont(16);
    expect(result).toBeGreaterThan(0);
  });

  it('should return 0 for zero input', () => {
    expect(scaleFont(0)).toBe(0);
  });

  it('should round to nearest integer', () => {
    const result = scaleFont(16, 0.5, 400);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('should incorporate font scale from PixelRatio', () => {
    // scaleFont applies PixelRatio.getFontScale() clamped between 0.85 and 1.5
    // For width=375: scaleFactor=1, moderateFactor=1
    // Result = 16 * 1 * clampedFontScale
    const result = scaleFont(16, 0.5, 375);
    // With any fontScale, result should be >= 16 * 0.85 = 13.6 and <= 16 * 1.5 = 24
    expect(result).toBeGreaterThanOrEqual(Math.round(16 * 0.85));
    expect(result).toBeLessThanOrEqual(Math.round(16 * 1.5));
  });

  it('should accept custom factor parameter', () => {
    const lowFactor = scaleFont(16, 0.1, 500);
    const highFactor = scaleFont(16, 0.9, 500);
    // Higher factor means more sensitivity to width change, so for wider screen
    // highFactor should be >= lowFactor
    expect(highFactor).toBeGreaterThanOrEqual(lowFactor);
  });

  it('should cap the scale factor at MAX_SCALE_FACTOR (1.5)', () => {
    // Very wide screen should not keep scaling indefinitely
    const result1 = scaleFont(16, 0.5, 2000);
    const result2 = scaleFont(16, 0.5, 3000);
    expect(result1).toBe(result2); // both capped
  });

  it('should handle common font sizes', () => {
    // Just verify they produce reasonable results
    expect(scaleFont(12)).toBeGreaterThan(0);
    expect(scaleFont(14)).toBeGreaterThan(0);
    expect(scaleFont(16)).toBeGreaterThan(0);
    expect(scaleFont(20)).toBeGreaterThan(0);
    expect(scaleFont(24)).toBeGreaterThan(0);
    expect(scaleFont(32)).toBeGreaterThan(0);
  });

  it('should handle negative input', () => {
    const result = scaleFont(-16, 0.5, 375);
    expect(result).toBeLessThan(0);
  });
});

// ─── Device Detection ────────────────────────────────────────────────────────

describe('isTablet', () => {
  it('should return a boolean', () => {
    expect(typeof isTablet()).toBe('boolean');
  });

  it('should return false for phone-width screen (375px from mock)', () => {
    // expo-device mock has no deviceType, falls back to width check
    // width 375 < 768 => phone => isTablet returns false
    expect(isTablet()).toBe(false);
  });
});

describe('isFoldable', () => {
  it('should return a boolean', () => {
    expect(typeof isFoldable()).toBe('boolean');
  });

  it('should return false for standard phone dimensions', () => {
    // modelName "Test Model" does not contain fold keywords
    // width 375 is not in 600-900 range
    expect(isFoldable()).toBe(false);
  });
});

// ─── SPACING Constants ───────────────────────────────────────────────────────

describe('SPACING', () => {
  it('should have all expected spacing keys', () => {
    expect(SPACING).toHaveProperty('xs');
    expect(SPACING).toHaveProperty('sm');
    expect(SPACING).toHaveProperty('md');
    expect(SPACING).toHaveProperty('base');
    expect(SPACING).toHaveProperty('lg');
    expect(SPACING).toHaveProperty('xl');
    expect(SPACING).toHaveProperty('xxl');
    expect(SPACING).toHaveProperty('xxxl');
  });

  it('should have spacing values in ascending order', () => {
    expect(SPACING.xs).toBeLessThanOrEqual(SPACING.sm);
    expect(SPACING.sm).toBeLessThanOrEqual(SPACING.md);
    expect(SPACING.md).toBeLessThanOrEqual(SPACING.base);
    expect(SPACING.base).toBeLessThanOrEqual(SPACING.lg);
    expect(SPACING.lg).toBeLessThanOrEqual(SPACING.xl);
    expect(SPACING.xl).toBeLessThanOrEqual(SPACING.xxl);
    expect(SPACING.xxl).toBeLessThanOrEqual(SPACING.xxxl);
  });

  it('should have all positive values', () => {
    Object.values(SPACING).forEach((value) => {
      expect(value).toBeGreaterThan(0);
    });
  });
});

// ─── DIMENSIONS Constants ────────────────────────────────────────────────────

describe('DIMENSIONS', () => {
  it('should have all expected dimension keys', () => {
    expect(DIMENSIONS).toHaveProperty('buttonHeight');
    expect(DIMENSIONS).toHaveProperty('buttonHeightSmall');
    expect(DIMENSIONS).toHaveProperty('buttonHeightLarge');
    expect(DIMENSIONS).toHaveProperty('inputHeight');
    expect(DIMENSIONS).toHaveProperty('inputPadding');
    expect(DIMENSIONS).toHaveProperty('cardPadding');
    expect(DIMENSIONS).toHaveProperty('cardBorderRadius');
    expect(DIMENSIONS).toHaveProperty('iconSize');
    expect(DIMENSIONS).toHaveProperty('iconSizeSmall');
    expect(DIMENSIONS).toHaveProperty('iconSizeLarge');
    expect(DIMENSIONS).toHaveProperty('avatarSize');
    expect(DIMENSIONS).toHaveProperty('avatarSizeSmall');
    expect(DIMENSIONS).toHaveProperty('avatarSizeLarge');
    expect(DIMENSIONS).toHaveProperty('logoSize');
    expect(DIMENSIONS).toHaveProperty('logoSizeMin');
  });

  it('should have all positive numeric values', () => {
    Object.values(DIMENSIONS).forEach((value) => {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });
  });

  it('should have button heights in ascending order', () => {
    expect(DIMENSIONS.buttonHeightSmall).toBeLessThanOrEqual(DIMENSIONS.buttonHeight);
    expect(DIMENSIONS.buttonHeight).toBeLessThanOrEqual(DIMENSIONS.buttonHeightLarge);
  });

  it('should have icon sizes in ascending order', () => {
    expect(DIMENSIONS.iconSizeSmall).toBeLessThanOrEqual(DIMENSIONS.iconSize);
    expect(DIMENSIONS.iconSize).toBeLessThanOrEqual(DIMENSIONS.iconSizeLarge);
  });

  it('should have avatar sizes in ascending order', () => {
    expect(DIMENSIONS.avatarSizeSmall).toBeLessThanOrEqual(DIMENSIONS.avatarSize);
    expect(DIMENSIONS.avatarSize).toBeLessThanOrEqual(DIMENSIONS.avatarSizeLarge);
  });

  it('should have logoSize <= 320', () => {
    expect(DIMENSIONS.logoSize).toBeLessThanOrEqual(320);
  });
});

// ─── MAX_CONTENT_WIDTH ───────────────────────────────────────────────────────

describe('MAX_CONTENT_WIDTH', () => {
  it('should be a positive number', () => {
    expect(MAX_CONTENT_WIDTH).toBeGreaterThan(0);
  });

  it('should equal 720', () => {
    expect(MAX_CONTENT_WIDTH).toBe(720);
  });
});

// ─── getContentWidth() ───────────────────────────────────────────────────────

describe('getContentWidth', () => {
  it('should return full width for phone-size screen', () => {
    // isTablet() and isFoldable() return false for 375 width
    const result = getContentWidth(375);
    expect(result).toBe(375);
  });

  it('should return a positive number', () => {
    expect(getContentWidth()).toBeGreaterThan(0);
  });
});

// ─── getContentPadding() ─────────────────────────────────────────────────────

describe('getContentPadding', () => {
  it('should return 0 for phone-size screen', () => {
    // isTablet() and isFoldable() return false for 375 width
    expect(getContentPadding(375)).toBe(0);
  });

  it('should return a non-negative number', () => {
    expect(getContentPadding()).toBeGreaterThanOrEqual(0);
  });
});
