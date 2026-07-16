/**
 * getTodayCount Utility
 *
 * Counts items from a collection that have timestamps matching today's date.
 */

import { isSameDay } from 'date-fns';
import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';

/**
 * Counts items where getTimestamp(item) is on today's date.
 */
export const getTodayCount = <T>(items: T[], getTimestamp: (item: T) => unknown): number => {
  return items.filter((item) => {
    const ts = normalizeTimestamp(getTimestamp(item));
    return isSameDay(ts, new Date());
  }).length;
};
