/**
 * Number Formatting Utilities
 */

/**
 * Format a number with locale-specific formatting
 */
export const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
  try {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
      return String(num ?? 0);
    }
    return new Intl.NumberFormat('en-US', options).format(num);
  } catch {
    return String(num ?? 0);
  }
};
