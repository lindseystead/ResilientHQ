/**
 * Email Validation Utilities
 *
 * Provides functions for validating email addresses.
 * Uses a pragmatic pattern for common email formats (not full RFC 5322).
 */

/**
 * Email validation result interface
 */
export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates email address format
 *
 * Uses a pragmatic pattern that checks basic local-part@domain.tld structure (not full RFC 5322).
 * Checks for proper email structure: local-part@domain.tld
 *
 * @param email - Email address to validate
 * @returns Validation result with isValid flag and optional error message
 *
 * @example
 * validateEmail("user@example.com") // { isValid: true }
 * validateEmail("invalid-email") // { isValid: false, error: "Invalid email format" }
 */
export const validateEmail = (email: string): EmailValidationResult => {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email is required',
    };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    return {
      isValid: false,
      error: 'Email is required',
    };
  }

  // Pragmatic structural check (local@domain.tld), not full RFC 5322
  // Allows most valid email formats while rejecting obviously invalid ones
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Additional check for minimum length and structure
  if (trimmedEmail.length < 5) {
    return {
      isValid: false,
      error: 'Email is too short',
    };
  }

  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Invalid email format',
    };
  }

  // Check for common invalid patterns
  if (trimmedEmail.startsWith('@') || trimmedEmail.endsWith('@')) {
    return {
      isValid: false,
      error: 'Invalid email format',
    };
  }

  // Check for consecutive dots or @ symbols
  if (trimmedEmail.includes('..') || trimmedEmail.split('@').length !== 2) {
    return {
      isValid: false,
      error: 'Invalid email format',
    };
  }

  return {
    isValid: true,
  };
};

/**
 * Quick email validation (boolean only)
 *
 * Returns a simple boolean for quick validation checks.
 * Use validateEmail() for detailed error messages.
 *
 * @param email - Email address to validate
 * @returns True if email is valid, false otherwise
 *
 * @example
 * isValidEmail("user@example.com") // true
 */
export const isValidEmail = (email: string): boolean => {
  return validateEmail(email).isValid;
};
