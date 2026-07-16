/**
 * Relative Time Formatting Utilities
 */

import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { formatDistanceToNow } from 'date-fns';

/**
 * Format relative time (e.g., "3 hours ago", "in 2 days")
 */
export const formatRelativeTime = (
  date: Date | number | unknown,
  options?: {
    includeSeconds?: boolean;
    addSuffix?: boolean;
  },
): string => {
  try {
    const dateObj = normalizeTimestamp(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffSeconds = Math.abs(Math.floor(diffMs / 1000));

    if (diffSeconds < 10) {
      return 'just now';
    }
    if (diffSeconds < 60) {
      return `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`;
    }

    const { includeSeconds = false, addSuffix = true } = options || {};

    return formatDistanceToNow(dateObj, {
      includeSeconds,
      addSuffix,
    });
  } catch {
    return '';
  }
};
