/**
 * Formatting Utilities Module
 *
 * Formatting utilities for dates, times, numbers, and text.
 * Tree-shakeable exports for optimal bundle size.
 * All functions handle invalid input safely.
 */

// Date formatting
export { formatDate, normalizeFirestoreTimestamp, toISO } from './date';

// Time formatting
export { formatTime, is24HourFormat } from './time';

// DateTime formatting
export { formatDateTime } from './datetime';

// Relative time formatting
export { formatRelativeTime } from './relativeTime';

// Number formatting
export { formatNumber } from './number';

// Text formatting
export { capitalize, getInitials, truncate } from './text';
