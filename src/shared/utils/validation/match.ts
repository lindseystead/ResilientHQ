/**
 * Match Validation Utilities
 *
 * Provides functions for validating that two values match.
 * Commonly used for password confirmation, email confirmation, etc.
 */

/**
 * Match validation result interface
 */
export interface MatchValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates that two values match (e.g., password confirmation)
 *
 * Compares two values for equality, typically used for confirmation fields.
 * Provides clear error messages when values don't match.
 *
 * @param value1 - First value to compare
 * @param value2 - Second value to compare
 * @param fieldName - Name of the field for error message (default: 'Fields')
 * @returns Validation result with isValid flag and optional error message
 *
 * @example
 * validateMatch("password123", "password123", "Passwords") // { isValid: true }
 * validateMatch("password123", "password456", "Passwords") // { isValid: false, error: "Passwords do not match" }
 */
export const validateMatch = (
  value1: string,
  value2: string,
  fieldName: string = 'Fields',
): MatchValidationResult => {
  if (value1 !== value2) {
    return {
      isValid: false,
      error: `${fieldName} do not match`,
    };
  }

  return {
    isValid: true,
  };
};
