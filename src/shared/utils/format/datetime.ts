/**
 * DateTime Formatting Utilities
 */

import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { format as dateFnsFormat } from 'date-fns';
import { is24HourFormat } from './time';

/**
 * Format date and time together
 */
export const formatDateTime = (date: Date | number | unknown, formatString?: string): string => {
  try {
    const dateObj = normalizeTimestamp(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    const defaultFormat =
      formatString || (is24HourFormat() ? 'MMM d, yyyy • HH:mm' : 'MMM d, yyyy • h:mm a');
    return dateFnsFormat(dateObj, defaultFormat);
  } catch {
    return '';
  }
};
