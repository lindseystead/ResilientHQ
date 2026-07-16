/**
 * Form Validation Hook
 *
 * Centralized form validation logic for consistent validation across auth screens.
 * Provides email, password, name, and match validation with error messages.
 */

import { TEXT } from '@/src/config/text';
import {
  isValidEmail,
  validateMatch,
  validateName,
  validatePassword,
  validateRequired,
} from '@/src/shared/utils/validation';
import { useCallback } from 'react';

export interface FormValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: string | undefined;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FormValidationErrors;
}

export interface UseFormValidationOptions {
  /**
   * Whether to validate on change (default: false)
   */
  validateOnChange?: boolean;

  /**
   * Custom field names for error messages
   */
  fieldNames?: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
  };
}

/**
 * useFormValidation Hook
 *
 * Provides centralized form validation methods for auth forms.
 *
 * @example
 * ```tsx
 * const { validateEmail, validatePassword, validateForm, getInputErrorMessage } = useFormValidation();
 *
 * const emailError = validateEmail(email);
 * const passwordError = validatePassword(password);
 * ```
 */
export const useFormValidation = (options: UseFormValidationOptions = {}) => {
  const { fieldNames = {} } = options;

  /**
   * Validate email field
   */
  const validateEmailField = useCallback(
    (email: string): string => {
      const emailFieldName = fieldNames.email || 'Email';

      // Check required
      const requiredValidation = validateRequired(email, emailFieldName);
      if (!requiredValidation.isValid) {
        return requiredValidation.error || '';
      }

      // Check format
      if (!isValidEmail(email.trim())) {
        return TEXT.errorEmailRequired;
      }

      return '';
    },
    [fieldNames.email],
  );

  /**
   * Validate password field
   */
  const validatePasswordField = useCallback(
    (password: string): string => {
      const passwordFieldName = fieldNames.password || 'Password';

      // Check required
      const requiredValidation = validateRequired(password, passwordFieldName);
      if (!requiredValidation.isValid) {
        return requiredValidation.error || '';
      }

      // Check strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return passwordValidation.error || '';
      }

      return '';
    },
    [fieldNames.password],
  );

  /**
   * Validate password field for login (required only)
   */
  const validateLoginPasswordField = useCallback(
    (password: string): string => {
      const passwordFieldName = fieldNames.password || 'Password';
      const requiredValidation = validateRequired(password, passwordFieldName);
      if (!requiredValidation.isValid) {
        return requiredValidation.error || '';
      }
      return '';
    },
    [fieldNames.password],
  );

  /**
   * Validate name field
   */
  const validateNameField = useCallback((name: string, fieldName: string = 'Name'): string => {
    const nameValidation = validateName(name, { fieldName });
    if (!nameValidation.isValid) {
      return nameValidation.error || '';
    }
    return '';
  }, []);

  /**
   * Validate password match
   */
  const validatePasswordMatch = useCallback(
    (password: string, confirmPassword: string): string => {
      const confirmPasswordFieldName = fieldNames.confirmPassword || 'Confirm Password';

      // Check required
      const requiredValidation = validateRequired(confirmPassword, confirmPasswordFieldName);
      if (!requiredValidation.isValid) {
        return requiredValidation.error || '';
      }

      // Check match
      const matchValidation = validateMatch(password, confirmPassword, 'Passwords');
      if (!matchValidation.isValid) {
        return matchValidation.error || TEXT.errorPasswordsMatch;
      }

      return '';
    },
    [fieldNames.confirmPassword],
  );

  /**
   * Get error message for a specific input field
   */
  const getInputErrorMessage = useCallback(
    (fieldName: string, errors: FormValidationErrors): string => {
      return errors[fieldName] || '';
    },
    [],
  );

  /**
   * Validate entire login form
   */
  const validateLoginForm = useCallback(
    (email: string, password: string): FormValidationResult => {
      const errors: FormValidationErrors = {};
      let isValid = true;

      const emailError = validateEmailField(email);
      if (emailError) {
        errors.email = emailError;
        isValid = false;
      }

      const passwordError = validateLoginPasswordField(password);
      if (passwordError) {
        errors.password = passwordError;
        isValid = false;
      }

      return { isValid, errors };
    },
    [validateEmailField, validateLoginPasswordField],
  );

  /**
   * Validate entire signup form
   */
  const validateSignupForm = useCallback(
    (
      firstName: string,
      lastName: string,
      email: string,
      password: string,
      confirmPassword: string,
    ): FormValidationResult => {
      const errors: FormValidationErrors = {};
      let isValid = true;

      const firstNameFieldName = fieldNames.firstName || 'First name';
      const firstNameError = validateNameField(firstName, firstNameFieldName);
      if (firstNameError) {
        errors.firstName = firstNameError || TEXT.errorFirstNameRequired;
        isValid = false;
      }

      const lastNameFieldName = fieldNames.lastName || 'Last name';
      const lastNameError = validateNameField(lastName, lastNameFieldName);
      if (lastNameError) {
        errors.lastName = lastNameError || TEXT.errorLastNameRequired;
        isValid = false;
      }

      const emailError = validateEmailField(email);
      if (emailError) {
        errors.email = emailError;
        isValid = false;
      }

      const passwordError = validatePasswordField(password);
      if (passwordError) {
        errors.password = passwordError;
        isValid = false;
      }

      const confirmPasswordError = validatePasswordMatch(password, confirmPassword);
      if (confirmPasswordError) {
        errors.confirmPassword = confirmPasswordError;
        isValid = false;
      }

      return { isValid, errors };
    },
    [
      validateEmailField,
      validatePasswordField,
      validateNameField,
      validatePasswordMatch,
      fieldNames,
    ],
  );

  /**
   * Validate reset password form
   */
  const validateResetPasswordForm = useCallback(
    (email: string): FormValidationResult => {
      const errors: FormValidationErrors = {};
      let isValid = true;

      const emailError = validateEmailField(email);
      if (emailError) {
        errors.email = emailError;
        isValid = false;
      }

      return { isValid, errors };
    },
    [validateEmailField],
  );

  return {
    validateEmail: validateEmailField,
    validatePassword: validatePasswordField,
    validateName: validateNameField,
    validatePasswordMatch,
    validateLoginForm,
    validateSignupForm,
    validateResetPasswordForm,
    getInputErrorMessage,
  };
};
