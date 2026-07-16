/**
 * Date Utilities Tests
 *
 * Comprehensive tests for date formatting, normalization, and calculations.
 */

import { getTodayCount } from '@/src/shared/utils/dates/getTodayCount';
import { normalizeTimestamp as normalizeFirestoreTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { formatDate, formatRelativeTime, formatTime } from '@/src/shared/utils/format';

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format valid dates', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should handle invalid dates gracefully', () => {
      const invalid = new Date('invalid');
      const formatted = formatDate(invalid);
      // formatDate returns empty string for invalid dates (as per implementation)
      expect(formatted).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(() => formatDate(null as any)).not.toThrow();
      expect(() => formatDate(undefined as any)).not.toThrow();
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const formatted = formatTime(date);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format recent times as "just now" or minutes ago', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      const formatted = formatRelativeTime(oneMinuteAgo);
      expect(formatted).toBeTruthy();
    });

    it('should format past dates correctly', () => {
      const past = new Date('2024-01-01');
      const formatted = formatRelativeTime(past);
      expect(formatted).toBeTruthy();
    });
  });

  describe('normalizeTimestamp', () => {
    it('should normalize Firestore timestamps', () => {
      const timestamp = { seconds: 1705315200, nanoseconds: 0 };
      const normalized = normalizeFirestoreTimestamp(timestamp);
      expect(normalized).toBeInstanceOf(Date);
    });

    it('should handle Date objects', () => {
      const date = new Date();
      const normalized = normalizeFirestoreTimestamp(date);
      expect(normalized).toBeInstanceOf(Date);
    });
  });

  describe('getTodayCount', () => {
    it('should return count for today', () => {
      const items = [
        { timestamp: new Date() },
        { timestamp: new Date(Date.now() - 86400000) }, // Yesterday
        { timestamp: new Date() },
      ];
      const count = getTodayCount(items, (item) => item.timestamp);
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
      expect(count).toBe(2); // Two items from today
    });
  });
});
