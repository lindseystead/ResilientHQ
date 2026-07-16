/**
 * Format Utilities Tests
 *
 * Comprehensive tests for date, time, datetime, relative time, number,
 * and text formatting utilities with edge cases and error handling.
 */

import {
  capitalize,
  formatDate,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
  formatTime,
  getInitials,
  normalizeFirestoreTimestamp,
  toISO,
  truncate,
} from '@/src/shared/utils/format';

// ─── Date Formatting ─────────────────────────────────────────────────────────

describe('formatDate', () => {
  describe('valid dates', () => {
    it('should format a Date object with default format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDate(date);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      // Default format is 'MMM d, yyyy'
      expect(result).toContain('2024');
      expect(result).toContain('15');
    });

    it('should format with a custom format string', () => {
      // Use local time constructor to avoid timezone issues
      const date = new Date(2024, 5, 20); // June 20, 2024 local
      const result = formatDate(date, 'yyyy-MM-dd');
      expect(result).toBe('2024-06-20');
    });

    it('should format a numeric timestamp (milliseconds)', () => {
      const timestamp = new Date('2024-03-10T12:00:00Z').getTime();
      const result = formatDate(timestamp);
      expect(result).toBeTruthy();
      expect(result).toContain('2024');
    });

    it('should format a date string', () => {
      const result = formatDate('2024-07-04T12:00:00Z', 'yyyy');
      expect(result).toContain('2024');
    });

    it('should handle Firestore-like timestamp objects', () => {
      const firestoreTimestamp = {
        toDate: () => new Date(2024, 0, 1), // Jan 1, 2024 local
      };
      const result = formatDate(firestoreTimestamp, 'yyyy-MM-dd');
      expect(result).toBe('2024-01-01');
    });
  });

  describe('invalid dates', () => {
    it('should return empty string for invalid Date object', () => {
      expect(formatDate(new Date('invalid'))).toBe('');
    });

    it('should handle NaN gracefully (normalizeTimestamp falls back to current date)', () => {
      const result = formatDate(NaN);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle null gracefully', () => {
      // normalizeTimestamp returns new Date() for null, so it should not be empty
      const result = formatDate(null);
      expect(typeof result).toBe('string');
    });

    it('should handle undefined gracefully', () => {
      const result = formatDate(undefined);
      expect(typeof result).toBe('string');
    });
  });

  describe('edge cases', () => {
    it('should format epoch date', () => {
      const result = formatDate(new Date(0), 'yyyy');
      // Timezone offset may show 1969 or 1970
      expect(['1969', '1970']).toContain(result);
    });

    it('should format dates far in the future', () => {
      const futureDate = new Date('2099-12-31T23:59:59Z');
      const result = formatDate(futureDate, 'yyyy');
      expect(result).toBe('2099');
    });
  });
});

describe('toISO', () => {
  it('should convert Date to ISO string', () => {
    const date = new Date('2024-01-15T10:30:00.000Z');
    expect(toISO(date)).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should convert numeric timestamp to ISO string', () => {
    const timestamp = new Date('2024-01-15T10:30:00.000Z').getTime();
    const result = toISO(timestamp);
    expect(result).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should return empty string for invalid date', () => {
    expect(toISO(new Date('invalid'))).toBe('');
  });

  it('should handle NaN gracefully (normalizeTimestamp falls back to current date)', () => {
    const result = toISO(NaN);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle Firestore-like timestamp', () => {
    const firestoreTimestamp = {
      toDate: () => new Date('2024-01-15T10:30:00.000Z'),
    };
    expect(toISO(firestoreTimestamp)).toBe('2024-01-15T10:30:00.000Z');
  });
});

describe('normalizeFirestoreTimestamp', () => {
  it('should pass through Date objects', () => {
    const date = new Date('2024-01-15T00:00:00Z');
    const result = normalizeFirestoreTimestamp(date);
    expect(result).toEqual(date);
  });

  it('should convert Firestore timestamp to Date', () => {
    const expectedDate = new Date('2024-01-15T00:00:00Z');
    const firestoreTimestamp = { toDate: () => expectedDate };
    const result = normalizeFirestoreTimestamp(firestoreTimestamp);
    expect(result).toEqual(expectedDate);
  });

  it('should return current date for null', () => {
    const before = Date.now();
    const result = normalizeFirestoreTimestamp(null);
    const after = Date.now();
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after);
  });

  it('should return a Date for numeric timestamp', () => {
    const ts = 1705276800000; // 2024-01-15T00:00:00Z
    const result = normalizeFirestoreTimestamp(ts);
    expect(result instanceof Date).toBe(true);
  });
});

// ─── Time Formatting ─────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('should format a Date with time', () => {
    const date = new Date('2024-01-15T14:30:00Z');
    const result = formatTime(date);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should format with custom format string', () => {
    const date = new Date('2024-01-15T14:30:00Z');
    const result = formatTime(date, 'HH:mm:ss');
    expect(result).toContain(':');
    expect(result).toBeTruthy();
  });

  it('should return empty string for invalid date', () => {
    expect(formatTime(new Date('invalid'))).toBe('');
  });

  it('should handle numeric timestamp', () => {
    const timestamp = new Date('2024-01-15T14:30:00Z').getTime();
    const result = formatTime(timestamp);
    expect(result).toBeTruthy();
  });

  it('should handle midnight correctly', () => {
    const midnight = new Date('2024-01-15T00:00:00Z');
    const result = formatTime(midnight, 'HH:mm');
    expect(result).toBeTruthy();
  });

  it('should handle Firestore-like timestamp', () => {
    const firestoreTimestamp = {
      toDate: () => new Date('2024-01-15T14:30:00Z'),
    };
    const result = formatTime(firestoreTimestamp);
    expect(result).toBeTruthy();
  });
});

// ─── DateTime Formatting ─────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('should format date and time together', () => {
    const date = new Date('2024-01-15T14:30:00Z');
    const result = formatDateTime(date);
    expect(result).toBeTruthy();
    expect(result).toContain('2024');
  });

  it('should format with custom format string', () => {
    // Use a date constructed with local time to avoid timezone issues
    const date = new Date(2024, 5, 15, 10, 0, 0); // June 15, 2024 10:00 local
    const result = formatDateTime(date, 'yyyy-MM-dd HH:mm');
    expect(result).toBe('2024-06-15 10:00');
  });

  it('should return empty string for invalid date', () => {
    expect(formatDateTime(new Date('invalid'))).toBe('');
  });

  it('should handle numeric timestamp', () => {
    const timestamp = new Date('2024-01-15T14:30:00Z').getTime();
    const result = formatDateTime(timestamp);
    expect(result).toBeTruthy();
  });
});

// ─── Relative Time Formatting ────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  it('should return "just now" for very recent dates', () => {
    const now = new Date();
    const fiveSecondsAgo = new Date(now.getTime() - 5000);
    expect(formatRelativeTime(fiveSecondsAgo)).toBe('just now');
  });

  it('should return seconds format for 10-59 seconds ago', () => {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30000);
    const result = formatRelativeTime(thirtySecondsAgo);
    expect(result).toContain('seconds ago');
  });

  it('should handle 1 minute ago', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 61000);
    const result = formatRelativeTime(oneMinuteAgo);
    expect(result).toBeTruthy();
    expect(result).toContain('ago');
  });

  it('should handle dates from hours ago', () => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const result = formatRelativeTime(threeHoursAgo);
    expect(result).toBeTruthy();
    expect(result).toContain('ago');
  });

  it('should handle dates from days ago', () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(twoDaysAgo);
    expect(result).toBeTruthy();
  });

  it('should return empty string for invalid date', () => {
    expect(formatRelativeTime(new Date('invalid'))).toBe('');
  });

  it('should handle NaN gracefully (normalizeTimestamp falls back to current date)', () => {
    const result = formatRelativeTime(NaN);
    expect(typeof result).toBe('string');
    expect(result).toBe('just now');
  });

  it('should handle exactly 10 seconds ago', () => {
    const now = new Date();
    const tenSecondsAgo = new Date(now.getTime() - 10000);
    const result = formatRelativeTime(tenSecondsAgo);
    expect(result).toContain('second');
  });

  it('should handle addSuffix option', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const result = formatRelativeTime(fiveMinutesAgo, { addSuffix: true });
    expect(result).toContain('ago');
  });

  it('should handle Firestore-like timestamp', () => {
    const firestoreTimestamp = {
      toDate: () => new Date(Date.now() - 5000),
    };
    const result = formatRelativeTime(firestoreTimestamp);
    expect(result).toBeTruthy();
  });
});

// ─── Number Formatting ───────────────────────────────────────────────────────

describe('formatNumber', () => {
  describe('basic formatting', () => {
    it('should format integers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
    });

    it('should format large numbers', () => {
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should format zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('should format negative numbers', () => {
      expect(formatNumber(-1500)).toBe('-1,500');
    });

    it('should format decimal numbers', () => {
      const result = formatNumber(1234.56);
      expect(result).toContain('1,234');
    });

    it('should format small numbers without commas', () => {
      expect(formatNumber(999)).toBe('999');
    });
  });

  describe('with options', () => {
    it('should format as currency', () => {
      const result = formatNumber(1234.56, { style: 'currency', currency: 'USD' });
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    it('should format as percentage', () => {
      const result = formatNumber(0.75, { style: 'percent' });
      expect(result).toContain('75');
      expect(result).toContain('%');
    });

    it('should respect minimumFractionDigits', () => {
      const result = formatNumber(10, { minimumFractionDigits: 2 });
      expect(result).toBe('10.00');
    });

    it('should respect maximumFractionDigits', () => {
      const result = formatNumber(10.123456, { maximumFractionDigits: 2 });
      expect(result).toBe('10.12');
    });
  });

  describe('invalid inputs', () => {
    it('should return "NaN" for NaN', () => {
      expect(formatNumber(NaN)).toBe('NaN');
    });

    it('should return "Infinity" for Infinity', () => {
      expect(formatNumber(Infinity)).toBe('Infinity');
    });

    it('should return "-Infinity" for negative Infinity', () => {
      expect(formatNumber(-Infinity)).toBe('-Infinity');
    });

    it('should handle non-number input gracefully', () => {
      const result = formatNumber('not a number' as unknown as number);
      expect(typeof result).toBe('string');
      // String coercion: 'not a number' is not nullish so String('not a number') => 'not a number'
      expect(result).toBe('not a number');
    });

    it('should return "0" for null-like value', () => {
      expect(formatNumber(null as unknown as number)).toBe('0');
    });

    it('should return "0" for undefined', () => {
      expect(formatNumber(undefined as unknown as number)).toBe('0');
    });
  });

  describe('edge cases', () => {
    it('should format very large numbers', () => {
      const result = formatNumber(999999999999);
      expect(result).toContain('999,999,999,999');
    });

    it('should format very small decimals', () => {
      const result = formatNumber(0.001, { minimumFractionDigits: 3 });
      expect(result).toBe('0.001');
    });
  });
});

// ─── Text Formatting ─────────────────────────────────────────────────────────

describe('capitalize', () => {
  it('should capitalize first letter and lowercase rest', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('should handle already capitalized string', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('should handle all uppercase string', () => {
    expect(capitalize('HELLO')).toBe('Hello');
  });

  it('should handle single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('should return empty string for empty input', () => {
    expect(capitalize('')).toBe('');
  });

  it('should return empty string for null', () => {
    expect(capitalize(null as unknown as string)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(capitalize(undefined as unknown as string)).toBe('');
  });

  it('should handle string with numbers', () => {
    expect(capitalize('123abc')).toBe('123abc');
  });

  it('should handle string starting with space', () => {
    expect(capitalize(' hello')).toBe(' hello');
  });
});

describe('truncate', () => {
  it('should not truncate string shorter than limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('should not truncate string at exactly the limit', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  it('should truncate string longer than limit', () => {
    const result = truncate('Hello World, this is a long string', 15);
    expect(result.length).toBeLessThanOrEqual(15);
    expect(result).toContain('...');
  });

  it('should use default length of 50', () => {
    const longString = 'A'.repeat(60);
    const result = truncate(longString);
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result).toContain('...');
  });

  it('should use custom suffix', () => {
    const result = truncate('Hello World, this is a long string', 15, '---');
    expect(result).toContain('---');
    expect(result).not.toContain('...');
  });

  it('should return empty string for empty input', () => {
    expect(truncate('')).toBe('');
  });

  it('should return empty string for null', () => {
    expect(truncate(null as unknown as string)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(truncate(undefined as unknown as string)).toBe('');
  });

  it('should handle suffix longer than allowed space', () => {
    // Length is 5, suffix is "..." (3 chars), so only 2 chars from original
    const result = truncate('Hello World', 5);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

describe('getInitials', () => {
  it('should extract initials from first and last name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('should extract initials from single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('should handle three-part name (max 2 initials by default)', () => {
    expect(getInitials('Mary Jane Watson')).toBe('MJ');
  });

  it('should respect custom maxInitials', () => {
    expect(getInitials('Mary Jane Watson', 3)).toBe('MJW');
  });

  it('should handle single initial request', () => {
    expect(getInitials('John Doe', 1)).toBe('J');
  });

  it('should uppercase initials', () => {
    expect(getInitials('john doe')).toBe('JD');
  });

  it('should handle extra spaces', () => {
    expect(getInitials('  John   Doe  ')).toBe('JD');
  });

  it('should return empty string for empty input', () => {
    expect(getInitials('')).toBe('');
  });

  it('should return empty string for null', () => {
    expect(getInitials(null as unknown as string)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(getInitials(undefined as unknown as string)).toBe('');
  });

  it('should handle hyphenated name as single word', () => {
    expect(getInitials('Mary-Jane Watson')).toBe('MW');
  });
});
