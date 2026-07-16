/**
 * Required Field Validation Utilities
 *
 * Provides functions for validating that required fields are not empty.
 * Handles various input types safely.
 */

/**
 * Required validation result interface
 */
export interface RequiredValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates that a string is not empty after trimming
 *
 * Checks that a required field has a non-empty value.
 * Trims whitespace before validation.
 *
 * @param value - String to validate
 * @param fieldName - Name of the field for error message (default: 'Field')
 * @returns Validation result with isValid flag and optional error message
 *
 * @example
 * validateRequired("value") // { isValid: true }
 * validateRequired("  ") // { isValid: false, error: "Field is required" }
 * validateRequired("", "Email") // { isValid: false, error: "Email is required" }
 */
export const validateRequired = (
  value: string,
  fieldName: string = 'Field',
): RequiredValidationResult => {
  if (!value || typeof value !== 'string') {
    return {
      isValid: false,
      error: `${fieldName} is required`,
    };
  }

  if (!value.trim()) {
    return {
      isValid: false,
      error: `${fieldName} is required`,
    };
  }

  return {
    isValid: true,
  };
};
