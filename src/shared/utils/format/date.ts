/**
 * Date Formatting Utilities
 *
 * Provides functions for formatting dates in various formats.
 * Handles invalid dates safely and supports Firestore timestamp normalization.
 */

import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { format as dateFnsFormat } from 'date-fns';

/**
 * Format a date using the specified format string
 *
 * Safely formats a date object or timestamp with error handling.
 * Returns empty string for invalid dates.
 *
 * @param date - Date object, timestamp, or Firestore timestamp
 * @param formatString - Date format string (default: 'MMM d, yyyy')
 * @returns Formatted date string, or empty string if invalid
 *
 * @example
 * formatDate(new Date(), 'MMM d, yyyy') // "Jan 15, 2024"
 * formatDate(1705276800000, 'yyyy-MM-dd') // "2024-01-15"
 */
export const formatDate = (
  date: Date | number | unknown,
  formatString: string = 'MMM d, yyyy',
): string => {
  try {
    // Normalize Firestore timestamps and other date-like objects
    const dateObj = normalizeTimestamp(date);

    // Validate the date
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    return dateFnsFormat(dateObj, formatString);
  } catch {
    return '';
  }
};

/**
 * Format date to ISO string
 *
 * Converts a date to ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ).
 * Useful for API requests and data storage.
 *
 * @param date - Date object, timestamp, or Firestore timestamp
 * @returns ISO date string, or empty string if invalid
 *
 * @example
 * toISO(new Date()) // "2024-01-15T10:30:00.000Z"
 */
export const toISO = (date: Date | number | unknown): string => {
  try {
    const dateObj = normalizeTimestamp(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    return dateObj.toISOString();
  } catch {
    return '';
  }
};

/**
 * Normalize Firestore timestamp to Date
 *
 * Safely converts Firestore timestamps (with toDate method) to Date objects.
 * Handles Date objects, timestamps, and Firestore Timestamp objects.
 *
 * @param timestamp - Firestore timestamp, Date, or number
 * @returns Date object, or current date if invalid
 *
 * @example
 * normalizeFirestoreTimestamp(firestoreTimestamp) // Date object
 */
export const normalizeFirestoreTimestamp = (timestamp: unknown): Date => {
  return normalizeTimestamp(timestamp);
};
