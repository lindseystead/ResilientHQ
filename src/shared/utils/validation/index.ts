/**
 * Validation Utilities Module
 *
 * Validation utilities for user input, email addresses, passwords,
 * names, and other data formats. Tree-shakeable exports for optimal bundle size.
 * All functions return detailed validation results with error messages.
 */

// Email validation
export { isValidEmail, validateEmail } from './email';
export type { EmailValidationResult } from './email';

// Password validation
export { isValidPassword, validatePassword } from './password';
export type { PasswordValidationOptions, PasswordValidationResult } from './password';

// Name validation
export { isValidName, validateName } from './name';
export type { NameValidationOptions, NameValidationResult } from './name';

// Required validation
export { validateRequired } from './required';
export type { RequiredValidationResult } from './required';

// Match validation
export { validateMatch } from './match';
export type { MatchValidationResult } from './match';
