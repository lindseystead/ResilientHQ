/**
 * Text Formatting Utilities
 */

/**
 * Capitalize the first letter of a string
 */
export const capitalize = (str: string): string => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncate string to specified length
 */
export const truncate = (str: string, length: number = 50, suffix: string = '...'): string => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  if (str.length <= length) {
    return str;
  }
  return str.slice(0, length - suffix.length) + suffix;
};

/**
 * Extract initials from a name
 */
export const getInitials = (name: string, maxInitials: number = 2): string => {
  if (!name || typeof name !== 'string') {
    return '';
  }
  return name
    .trim()
    .split(' ')
    .filter((word) => word.length > 0)
    .slice(0, maxInitials)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
};
