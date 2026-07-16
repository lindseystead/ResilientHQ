/**
 * Name Validation Utilities
 *
 * Provides functions for validating names (first name, last name, etc.).
 * Supports international name formats with appropriate character sets.
 */

/**
 * Name validation result interface
 */
export interface NameValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Name validation options
 */
export interface NameValidationOptions {
  minLength?: number;
  maxLength?: number;
  allowNumbers?: boolean;
  allowSpecialChars?: boolean;
  fieldName?: string;
}

/**
 * Default name validation options
 */
const DEFAULT_NAME_OPTIONS: Required<Omit<NameValidationOptions, 'fieldName'>> & {
  fieldName: string;
} = {
  minLength: 2,
  maxLength: 50,
  allowNumbers: false,
  allowSpecialChars: true, // Allow hyphens, apostrophes, spaces
  fieldName: 'Name',
};

/**
 * Validates a name field (first name, last name, etc.)
 *
 * Validates name format with configurable rules for length and allowed characters.
 * Supports international names with appropriate character sets.
 *
 * @param name - Name to validate
 * @param options - Validation options (minLength, maxLength, etc.)
 * @returns Validation result with isValid flag and optional error message
 *
 * @example
 * validateName("John") // { isValid: true }
 * validateName("J") // { isValid: false, error: "Name must be at least 2 characters" }
 * validateName("John123") // { isValid: false, error: "Name can only contain letters, spaces, hyphens, and apostrophes" }
 */
export const validateName = (
  name: string,
  options: NameValidationOptions = {},
): NameValidationResult => {
  const opts = { ...DEFAULT_NAME_OPTIONS, ...options };

  if (!name || typeof name !== 'string') {
    return {
      isValid: false,
      error: `${opts.fieldName} is required`,
    };
  }

  const trimmedName = name.trim();

  // Check minimum length
  if (trimmedName.length < opts.minLength) {
    return {
      isValid: false,
      error: `${opts.fieldName} must be at least ${opts.minLength} character${opts.minLength !== 1 ? 's' : ''}`,
    };
  }

  // Check maximum length
  if (trimmedName.length > opts.maxLength) {
    return {
      isValid: false,
      error: `${opts.fieldName} must be no more than ${opts.maxLength} characters`,
    };
  }

  // Build regex pattern based on options
  let pattern = '^[a-zA-Z';

  if (opts.allowSpecialChars) {
    pattern += "\\s'-"; // Allow spaces, hyphens, apostrophes
  }

  if (opts.allowNumbers) {
    pattern += '0-9';
  }

  pattern += ']+$';

  const nameRegex = new RegExp(pattern);

  if (!nameRegex.test(trimmedName)) {
    const allowedChars = [
      'letters',
      opts.allowSpecialChars ? 'spaces, hyphens, and apostrophes' : '',
      opts.allowNumbers ? 'numbers' : '',
    ]
      .filter(Boolean)
      .join(', ');

    return {
      isValid: false,
      error: `${opts.fieldName} can only contain ${allowedChars}`,
    };
  }

  // Check for consecutive special characters
  if (opts.allowSpecialChars && /['-]{2,}/.test(trimmedName)) {
    return {
      isValid: false,
      error: `${opts.fieldName} cannot contain consecutive special characters`,
    };
  }

  // Check that name doesn't start or end with special characters
  if (opts.allowSpecialChars && /^['-]|['-]$/.test(trimmedName)) {
    return {
      isValid: false,
      error: `${opts.fieldName} cannot start or end with special characters`,
    };
  }

  return {
    isValid: true,
  };
};

/**
 * Quick name validation (boolean only)
 *
 * Returns a simple boolean for quick validation checks.
 * Use validateName() for detailed error messages.
 *
 * @param name - Name to validate
 * @param minLength - Minimum name length (default: 2)
 * @returns True if name is valid, false otherwise
 *
 * @example
 * isValidName("John") // true
 */
export const isValidName = (name: string, minLength: number = 2): boolean => {
  if (!name || typeof name !== 'string') {
    return false;
  }
  const trimmedName = name.trim();
  return trimmedName.length >= minLength && /^[a-zA-Z\s'-]+$/.test(trimmedName);
};
