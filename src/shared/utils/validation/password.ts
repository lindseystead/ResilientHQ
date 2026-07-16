/**
 * Password Validation Utilities
 *
 * Provides advanced password validation with strength requirements.
 * Supports configurable complexity rules (uppercase, numbers, symbols, min length).
 */

/**
 * Password validation result interface
 */
export interface PasswordValidationResult {
  isValid: boolean;
  error?: string;
  strength?: 'weak' | 'medium' | 'strong';
}

/**
 * Password validation options
 */
export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSymbol?: boolean;
  customErrorMessage?: string;
}

/**
 * Default password validation options
 */
const DEFAULT_PASSWORD_OPTIONS: Required<PasswordValidationOptions> = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSymbol: false, // Optional by default for better UX
  customErrorMessage: '',
};

/**
 * Validates password strength
 *
 * Validates password against configurable complexity requirements.
 * Returns detailed validation result with strength assessment.
 *
 * @param password - Password to validate
 * @param options - Validation options (minLength, requireUppercase, etc.)
 * @returns Validation result with isValid flag, error message, and strength rating
 *
 * @example
 * validatePassword("MyP@ssw0rd") // { isValid: true, strength: 'strong' }
 * validatePassword("weak") // { isValid: false, error: "Password must be at least 8 characters long" }
 */
export const validatePassword = (
  password: string,
  options: PasswordValidationOptions = {},
): PasswordValidationResult => {
  const opts = { ...DEFAULT_PASSWORD_OPTIONS, ...options };

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      error: opts.customErrorMessage || 'Password is required',
      strength: 'weak',
    };
  }

  const trimmedPassword = password.trim();

  // Check minimum length
  if (trimmedPassword.length < opts.minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${opts.minLength} characters long`,
      strength: 'weak',
    };
  }

  // Check for uppercase letter
  if (opts.requireUppercase && !/[A-Z]/.test(trimmedPassword)) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter',
      strength: 'weak',
    };
  }

  // Check for lowercase letter
  if (opts.requireLowercase && !/[a-z]/.test(trimmedPassword)) {
    return {
      isValid: false,
      error: 'Password must contain at least one lowercase letter',
      strength: 'weak',
    };
  }

  // Check for number
  if (opts.requireNumber && !/[0-9]/.test(trimmedPassword)) {
    return {
      isValid: false,
      error: 'Password must contain at least one number',
      strength: 'weak',
    };
  }

  // Check for symbol
  if (opts.requireSymbol && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmedPassword)) {
    return {
      isValid: false,
      error: 'Password must contain at least one symbol',
      strength: 'weak',
    };
  }

  // Calculate strength
  let strengthScore = 0;
  if (trimmedPassword.length >= 12) strengthScore += 2;
  else if (trimmedPassword.length >= 8) strengthScore += 1;

  if (/[A-Z]/.test(trimmedPassword)) strengthScore += 1;
  if (/[a-z]/.test(trimmedPassword)) strengthScore += 1;
  if (/[0-9]/.test(trimmedPassword)) strengthScore += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmedPassword)) strengthScore += 1;

  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (strengthScore >= 5) strength = 'strong';
  else if (strengthScore >= 3) strength = 'medium';

  return {
    isValid: true,
    strength,
  };
};

/**
 * Quick password validation (boolean only)
 *
 * Returns a simple boolean for quick validation checks.
 * Uses default requirements: min 8 chars, uppercase, lowercase, number.
 * Use validatePassword() for detailed error messages and strength assessment.
 *
 * @param password - Password to validate
 * @param minLength - Minimum password length (default: 8)
 * @returns True if password meets minimum requirements, false otherwise
 *
 * @example
 * isValidPassword("MyP@ssw0rd") // true
 */
export const isValidPassword = (password: string, minLength: number = 8): boolean => {
  if (!password || typeof password !== 'string') {
    return false;
  }

  const trimmed = password.trim();

  // Check minimum length
  if (trimmed.length < minLength) {
    return false;
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(trimmed)) {
    return false;
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(trimmed)) {
    return false;
  }

  // Check for number
  if (!/[0-9]/.test(trimmed)) {
    return false;
  }

  return true;
};
