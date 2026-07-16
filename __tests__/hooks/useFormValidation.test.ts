/**
 * useFormValidation Hook Tests
 *
 * Comprehensive tests for the form validation hook covering email, password,
 * name, password match, and all form-level validators (login, signup, reset).
 */

import { renderHook, act } from '@testing-library/react-native';
import { useFormValidation } from '@/src/shared/hooks/useFormValidation';

describe('useFormValidation', () => {
  // ─── Hook Return Shape ──────────────────────────────────────────────────

  describe('hook return value', () => {
    it('should return all expected validation functions', () => {
      const { result } = renderHook(() => useFormValidation());
      expect(typeof result.current.validateEmail).toBe('function');
      expect(typeof result.current.validatePassword).toBe('function');
      expect(typeof result.current.validateName).toBe('function');
      expect(typeof result.current.validatePasswordMatch).toBe('function');
      expect(typeof result.current.validateLoginForm).toBe('function');
      expect(typeof result.current.validateSignupForm).toBe('function');
      expect(typeof result.current.validateResetPasswordForm).toBe('function');
      expect(typeof result.current.getInputErrorMessage).toBe('function');
    });
  });

  // ─── Email Validation ──────────────────────────────────────────────────

  describe('validateEmail', () => {
    it('should return empty string for valid email', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validateEmail('test@example.com');
      });
      expect(error).toBe('');
    });

    it('should return error for empty email', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validateEmail('');
      });
      expect(error).toBeTruthy();
      expect(error).toContain('required');
    });

    it('should return error for whitespace-only email', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validateEmail('   ');
      });
      expect(error).toBeTruthy();
    });

    it('should return error for invalid email format', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validateEmail('not-an-email');
      });
      expect(error).toBeTruthy();
    });

    it('should return error for email without TLD', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validateEmail('user@domain');
      });
      expect(error).toBeTruthy();
    });

    it('should accept email with plus addressing', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validateEmail('user+tag@example.com');
      });
      expect(error).toBe('');
    });

    it('should trim email before validating', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validateEmail('  test@example.com  ');
      });
      expect(error).toBe('');
    });
  });

  // ─── Password Validation ──────────────────────────────────────────────

  describe('validatePassword', () => {
    it('should return empty string for strong password', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validatePassword('Password123!');
      });
      expect(error).toBe('');
    });

    it('should return empty string for password meeting minimum requirements', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validatePassword('Abcdefg1');
      });
      expect(error).toBe('');
    });

    it('should return error for empty password', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validatePassword('');
      });
      expect(error).toBeTruthy();
      expect(error).toContain('required');
    });

    it('should return error for short password', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validatePassword('Abc1');
      });
      expect(error).toBeTruthy();
      expect(error).toContain('at least');
    });

    it('should return error for password without uppercase', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validatePassword('password123');
      });
      expect(error).toBeTruthy();
      expect(error).toContain('uppercase');
    });

    it('should return error for password without lowercase', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validatePassword('PASSWORD123');
      });
      expect(error).toBeTruthy();
      expect(error).toContain('lowercase');
    });

    it('should return error for password without number', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validatePassword('PasswordOnly');
      });
      expect(error).toBeTruthy();
      expect(error).toContain('number');
    });
  });

  // ─── Name Validation ──────────────────────────────────────────────────

  describe('validateName', () => {
    it('should return empty string for valid name', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validateName('John');
      });
      expect(error).toBe('');
    });

    it('should return empty string for hyphenated name', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validateName('Mary-Jane');
      });
      expect(error).toBe('');
    });

    it('should return error for empty name', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validateName('');
      });
      expect(error).toBeTruthy();
    });

    it('should return error for single character name', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validateName('A');
      });
      expect(error).toBeTruthy();
      expect(error).toContain('at least 2');
    });

    it('should return error for name with numbers', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validateName('John123');
      });
      expect(error).toBeTruthy();
    });

    it('should use custom field name in error message', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validateName('', 'First name');
      });
      expect(error).toContain('First name');
    });
  });

  // ─── Password Match Validation ─────────────────────────────────────────

  describe('validatePasswordMatch', () => {
    it('should return empty string for matching passwords', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validatePasswordMatch('Password123!', 'Password123!');
      });
      expect(error).toBe('');
    });

    it('should return error for non-matching passwords', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validatePasswordMatch('Password123!', 'Different123!');
      });
      expect(error).toBeTruthy();
    });

    it('should return error for empty confirm password', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validatePasswordMatch('Password123!', '');
      });
      expect(error).toBeTruthy();
      expect(error).toContain('required');
    });

    it('should be case-sensitive', () => {
      const { result } = renderHook(() => useFormValidation());
      let error: string = '';
      act(() => {
        error = result.current.validatePasswordMatch('Password123', 'password123');
      });
      expect(error).toBeTruthy();
    });
  });

  // ─── Login Form Validation ─────────────────────────────────────────────

  describe('validateLoginForm', () => {
    it('should validate correct login form as valid', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: false,
        errors: {},
      };
      act(() => {
        validation = result.current.validateLoginForm('test@example.com', 'anypassword');
      });
      expect(validation.isValid).toBe(true);
      expect(Object.keys(validation.errors).length).toBe(0);
    });

    it('should reject empty email and password', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: true,
        errors: {},
      };
      act(() => {
        validation = result.current.validateLoginForm('', '');
      });
      expect(validation.isValid).toBe(false);
      expect(validation.errors.email).toBeTruthy();
      expect(validation.errors.password).toBeTruthy();
    });

    it('should reject invalid email with valid password', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: true,
        errors: {},
      };
      act(() => {
        validation = result.current.validateLoginForm('invalid', 'Password123!');
      });
      expect(validation.isValid).toBe(false);
      expect(validation.errors.email).toBeTruthy();
      expect(validation.errors.password).toBeUndefined();
    });

    it('should reject valid email with empty password', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: true,
        errors: {},
      };
      act(() => {
        validation = result.current.validateLoginForm('test@example.com', '');
      });
      expect(validation.isValid).toBe(false);
      expect(validation.errors.email).toBeUndefined();
      expect(validation.errors.password).toBeTruthy();
    });

    it('should accept any non-empty password (login uses required-only check)', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: false,
        errors: {},
      };
      act(() => {
        validation = result.current.validateLoginForm('test@example.com', 'abc');
      });
      // Login form only checks if password is non-empty, not strength
      expect(validation.isValid).toBe(true);
    });
  });

  // ─── Signup Form Validation ────────────────────────────────────────────

  describe('validateSignupForm', () => {
    it('should validate correct signup form as valid', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: false,
        errors: {},
      };
      act(() => {
        validation = result.current.validateSignupForm(
          'John',
          'Doe',
          'john@example.com',
          'Password123!',
          'Password123!',
        );
      });
      expect(validation.isValid).toBe(true);
      expect(Object.keys(validation.errors).length).toBe(0);
    });

    it('should reject all empty fields', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: true,
        errors: {},
      };
      act(() => {
        validation = result.current.validateSignupForm('', '', '', '', '');
      });
      expect(validation.isValid).toBe(false);
      expect(validation.errors.firstName).toBeTruthy();
      expect(validation.errors.lastName).toBeTruthy();
      expect(validation.errors.email).toBeTruthy();
      expect(validation.errors.password).toBeTruthy();
      expect(validation.errors.confirmPassword).toBeTruthy();
    });

    it('should reject invalid first name', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: true,
        errors: {},
      };
      act(() => {
        validation = result.current.validateSignupForm(
          'J',
          'Doe',
          'john@example.com',
          'Password123!',
          'Password123!',
        );
      });
      expect(validation.isValid).toBe(false);
      expect(validation.errors.firstName).toBeTruthy();
    });

    it('should reject invalid last name', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: true,
        errors: {},
      };
      act(() => {
        validation = result.current.validateSignupForm(
          'John',
          '',
          'john@example.com',
          'Password123!',
          'Password123!',
        );
      });
      expect(validation.isValid).toBe(false);
      expect(validation.errors.lastName).toBeTruthy();
    });

    it('should reject invalid email', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: true,
        errors: {},
      };
      act(() => {
        validation = result.current.validateSignupForm(
          'John',
          'Doe',
          'invalid-email',
          'Password123!',
          'Password123!',
        );
      });
      expect(validation.isValid).toBe(false);
      expect(validation.errors.email).toBeTruthy();
    });

    it('should reject weak password', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: true,
        errors: {},
      };
      act(() => {
        validation = result.current.validateSignupForm(
          'John',
          'Doe',
          'john@example.com',
          'weak',
          'weak',
        );
      });
      expect(validation.isValid).toBe(false);
      expect(validation.errors.password).toBeTruthy();
    });

    it('should reject mismatched passwords', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: true,
        errors: {},
      };
      act(() => {
        validation = result.current.validateSignupForm(
          'John',
          'Doe',
          'john@example.com',
          'Password123!',
          'Different123!',
        );
      });
      expect(validation.isValid).toBe(false);
      expect(validation.errors.confirmPassword).toBeTruthy();
    });

    it('should accept hyphenated names', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: false,
        errors: {},
      };
      act(() => {
        validation = result.current.validateSignupForm(
          'Mary-Jane',
          "O'Brien",
          'mj@example.com',
          'Password123!',
          'Password123!',
        );
      });
      expect(validation.isValid).toBe(true);
    });

    it('should report multiple errors simultaneously', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: true,
        errors: {},
      };
      act(() => {
        validation = result.current.validateSignupForm('', '', 'bad-email', 'short', 'mismatch');
      });
      expect(validation.isValid).toBe(false);
      const errorKeys = Object.keys(validation.errors).filter(
        (k) => validation.errors[k] !== undefined,
      );
      expect(errorKeys.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ─── Reset Password Form Validation ────────────────────────────────────

  describe('validateResetPasswordForm', () => {
    it('should validate correct email as valid', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: false,
        errors: {},
      };
      act(() => {
        validation = result.current.validateResetPasswordForm('test@example.com');
      });
      expect(validation.isValid).toBe(true);
      expect(Object.keys(validation.errors).length).toBe(0);
    });

    it('should reject empty email', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: true,
        errors: {},
      };
      act(() => {
        validation = result.current.validateResetPasswordForm('');
      });
      expect(validation.isValid).toBe(false);
      expect(validation.errors.email).toBeTruthy();
    });

    it('should reject invalid email format', () => {
      const { result } = renderHook(() => useFormValidation());
      let validation: { isValid: boolean; errors: Record<string, string | undefined> } = {
        isValid: true,
        errors: {},
      };
      act(() => {
        validation = result.current.validateResetPasswordForm('not-valid');
      });
      expect(validation.isValid).toBe(false);
      expect(validation.errors.email).toBeTruthy();
    });
  });

  // ─── getInputErrorMessage ──────────────────────────────────────────────

  describe('getInputErrorMessage', () => {
    it('should return error for existing field', () => {
      const { result } = renderHook(() => useFormValidation());
      let msg: string = '';
      act(() => {
        msg = result.current.getInputErrorMessage('email', { email: 'Email error' });
      });
      expect(msg).toBe('Email error');
    });

    it('should return empty string for non-existent field', () => {
      const { result } = renderHook(() => useFormValidation());
      let msg: string = '';
      act(() => {
        msg = result.current.getInputErrorMessage('phone', { email: 'Email error' });
      });
      expect(msg).toBe('');
    });

    it('should return empty string for undefined error value', () => {
      const { result } = renderHook(() => useFormValidation());
      let msg: string = '';
      act(() => {
        msg = result.current.getInputErrorMessage('email', { email: undefined });
      });
      expect(msg).toBe('');
    });

    it('should return empty string for empty errors object', () => {
      const { result } = renderHook(() => useFormValidation());
      let msg: string = '';
      act(() => {
        msg = result.current.getInputErrorMessage('email', {});
      });
      expect(msg).toBe('');
    });
  });

  // ─── Custom Field Names ────────────────────────────────────────────────

  describe('custom field names via options', () => {
    it('should use custom email field name', () => {
      const { result } = renderHook(() =>
        useFormValidation({ fieldNames: { email: 'Email address' } }),
      );
      let error: string = '';
      act(() => {
        error = result.current.validateEmail('');
      });
      expect(error).toContain('Email address');
    });

    it('should use custom password field name for required check', () => {
      const { result } = renderHook(() =>
        useFormValidation({ fieldNames: { password: 'Secret key' } }),
      );
      let error: string = '';
      act(() => {
        error = result.current.validatePassword('');
      });
      expect(error).toContain('Secret key');
    });
  });
});
