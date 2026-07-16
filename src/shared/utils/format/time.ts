/**
 * Time Formatting Utilities
 *
 * Provides functions for formatting time with automatic 12/24-hour detection.
 */

import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { format as dateFnsFormat } from 'date-fns';

/**
 * Detect if device uses 24-hour format
 */
export const is24HourFormat = (): boolean => {
  try {
    const testDate = new Date(2024, 0, 1, 13, 0, 0);
    const timeString = testDate.toLocaleTimeString();
    return !timeString.includes('AM') && !timeString.includes('PM');
  } catch {
    return false;
  }
};

/**
 * Format time from a date
 */
export const formatTime = (date: Date | number | unknown, formatString?: string): string => {
  try {
    const dateObj = normalizeTimestamp(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    const defaultFormat = formatString || (is24HourFormat() ? 'HH:mm' : 'h:mm a');
    return dateFnsFormat(dateObj, defaultFormat);
  } catch {
    return '';
  }
};
