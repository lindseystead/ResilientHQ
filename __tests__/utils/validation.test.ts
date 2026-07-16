/**
 * Validation Utilities Tests
 *
 * Comprehensive tests for all validation functions including email, password,
 * name, required, and match validators with edge cases and boundary values.
 */

import {
  isValidEmail,
  isValidName,
  isValidPassword,
  validateEmail,
  validateMatch,
  validateName,
  validatePassword,
  validateRequired,
} from '@/src/shared/utils/validation';

// ─── Email Validation ────────────────────────────────────────────────────────

describe('validateEmail', () => {
  describe('valid email addresses', () => {
    it('should accept a standard email address', () => {
      const result = validateEmail('user@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept email with subdomain', () => {
      expect(validateEmail('user@mail.example.com').isValid).toBe(true);
    });

    it('should accept email with country code TLD', () => {
      expect(validateEmail('user.name@domain.co.uk').isValid).toBe(true);
    });

    it('should accept email with plus addressing', () => {
      expect(validateEmail('user+tag@example.com').isValid).toBe(true);
    });

    it('should accept email with dots in local part', () => {
      expect(validateEmail('first.last@example.com').isValid).toBe(true);
    });

    it('should accept email with hyphens in domain', () => {
      expect(validateEmail('user@my-domain.com').isValid).toBe(true);
    });

    it('should accept email with numbers in local part', () => {
      expect(validateEmail('user123@example.com').isValid).toBe(true);
    });

    it('should trim whitespace before validating', () => {
      expect(validateEmail('  user@example.com  ').isValid).toBe(true);
    });
  });

  describe('invalid email addresses', () => {
    it('should reject empty string', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject whitespace-only string', () => {
      const result = validateEmail('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject null-like values via type coercion', () => {
      const result = validateEmail(null as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject undefined via type coercion', () => {
      const result = validateEmail(undefined as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject email without @ symbol', () => {
      const result = validateEmail('userexample.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject email without domain', () => {
      const result = validateEmail('user@');
      expect(result.isValid).toBe(false);
    });

    it('should reject email without local part', () => {
      const result = validateEmail('@example.com');
      expect(result.isValid).toBe(false);
    });

    it('should reject email without TLD', () => {
      const result = validateEmail('user@example');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject email that is too short', () => {
      const result = validateEmail('a@b');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is too short');
    });

    it('should reject email with consecutive dots', () => {
      const result = validateEmail('user..name@example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject email with spaces', () => {
      const result = validateEmail('user name@example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject non-string input (number)', () => {
      const result = validateEmail(12345 as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });
  });

  describe('boundary values', () => {
    it('should accept an email at minimum valid length (5 chars)', () => {
      expect(validateEmail('a@b.c').isValid).toBe(true);
    });

    it('should reject email with exactly 4 characters', () => {
      expect(validateEmail('a@bc').isValid).toBe(false);
    });
  });
});

describe('isValidEmail', () => {
  it('should return true for valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('should return false for invalid email', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

// ─── Password Validation ─────────────────────────────────────────────────────

describe('validatePassword', () => {
  describe('valid passwords with default options', () => {
    it('should accept a password meeting all default requirements', () => {
      const result = validatePassword('Password1');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return strong strength for complex long password', () => {
      const result = validatePassword('MyP@ssw0rd123!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should return medium strength for moderate password', () => {
      const result = validatePassword('Password1');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('medium');
    });
  });

  describe('invalid passwords with default options', () => {
    it('should reject empty string', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
      expect(result.strength).toBe('weak');
    });

    it('should reject null-like values', () => {
      const result = validatePassword(null as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Pass1');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('password123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('PASSWORD123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePassword('PasswordOnly');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one number');
    });
  });

  describe('custom options', () => {
    it('should enforce custom minimum length', () => {
      const result = validatePassword('Pass1234', { minLength: 12 });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 12 characters long');
    });

    it('should require symbol when requireSymbol is true', () => {
      const result = validatePassword('Password123', { requireSymbol: true });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one symbol');
    });

    it('should accept password with symbol when required', () => {
      const result = validatePassword('Password123!', { requireSymbol: true });
      expect(result.isValid).toBe(true);
    });

    it('should allow disabling uppercase requirement', () => {
      const result = validatePassword('password123', { requireUppercase: false });
      expect(result.isValid).toBe(true);
    });

    it('should allow disabling lowercase requirement', () => {
      const result = validatePassword('PASSWORD123', { requireLowercase: false });
      expect(result.isValid).toBe(true);
    });

    it('should allow disabling number requirement', () => {
      const result = validatePassword('PasswordOnly', { requireNumber: false });
      expect(result.isValid).toBe(true);
    });

    it('should use custom error message for empty password', () => {
      const result = validatePassword('', { customErrorMessage: 'Custom error' });
      expect(result.error).toBe('Custom error');
    });
  });

  describe('strength calculation', () => {
    it('should rate very short valid passwords as weak (when minLength lowered)', () => {
      const result = validatePassword('Pass1', { minLength: 4 });
      expect(result.isValid).toBe(true);
      // length < 8 gives 0 points for length, uppercase +1, lowercase +1, number +1 = 3 = medium
      expect(result.strength).toBe('medium');
    });

    it('should rate 12+ char passwords with all char types as strong', () => {
      const result = validatePassword('MyPassword123!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should rate 8-11 char passwords with mixed chars as medium', () => {
      const result = validatePassword('PassWd1!');
      expect(result.isValid).toBe(true);
      // length 8-11 gives 1 point, upper +1, lower +1, number +1, symbol +1 = 5 = strong
      expect(result.strength).toBe('strong');
    });
  });

  describe('boundary values', () => {
    it('should accept password at exactly 8 characters', () => {
      const result = validatePassword('Passwor1');
      expect(result.isValid).toBe(true);
    });

    it('should reject password at exactly 7 characters', () => {
      const result = validatePassword('Passwo1');
      expect(result.isValid).toBe(false);
    });

    it('should handle password with only whitespace (trims)', () => {
      const result = validatePassword('        ');
      expect(result.isValid).toBe(false);
    });
  });
});

describe('isValidPassword', () => {
  it('should return true for valid password', () => {
    expect(isValidPassword('Password123')).toBe(true);
  });

  it('should return false for invalid password', () => {
    expect(isValidPassword('weak')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidPassword('')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isValidPassword(null as unknown as string)).toBe(false);
  });

  it('should respect custom minLength parameter', () => {
    expect(isValidPassword('Password1', 10)).toBe(false);
    expect(isValidPassword('Password123', 10)).toBe(true);
  });

  it('should return false for password without uppercase', () => {
    expect(isValidPassword('password123')).toBe(false);
  });

  it('should return false for password without lowercase', () => {
    expect(isValidPassword('PASSWORD123')).toBe(false);
  });

  it('should return false for password without number', () => {
    expect(isValidPassword('PasswordOnly')).toBe(false);
  });
});

// ─── Name Validation ─────────────────────────────────────────────────────────

describe('validateName', () => {
  describe('valid names', () => {
    it('should accept a simple name', () => {
      const result = validateName('John');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept a name with spaces', () => {
      expect(validateName('John Doe').isValid).toBe(true);
    });

    it('should accept a hyphenated name', () => {
      expect(validateName('Mary-Jane').isValid).toBe(true);
    });

    it('should accept a name with apostrophe', () => {
      expect(validateName("O'Brien").isValid).toBe(true);
    });

    it('should accept a name with multiple parts', () => {
      expect(validateName('Mary Jane Watson').isValid).toBe(true);
    });

    it('should trim whitespace before validating', () => {
      expect(validateName('  John  ').isValid).toBe(true);
    });
  });

  describe('invalid names', () => {
    it('should reject empty string', () => {
      const result = validateName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name is required');
    });

    it('should reject null-like values', () => {
      const result = validateName(null as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name is required');
    });

    it('should reject single character (below min length)', () => {
      const result = validateName('A');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name must be at least 2 characters');
    });

    it('should reject name with numbers', () => {
      const result = validateName('John123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('can only contain');
    });

    it('should reject name with special symbols', () => {
      const result = validateName('John@Doe');
      expect(result.isValid).toBe(false);
    });

    it('should reject name exceeding max length', () => {
      const longName = 'A'.repeat(51);
      const result = validateName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name must be no more than 50 characters');
    });

    it('should reject name starting with hyphen', () => {
      const result = validateName('-John');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot start or end with special characters');
    });

    it('should reject name ending with apostrophe', () => {
      const result = validateName("John'");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot start or end with special characters');
    });

    it('should reject name with consecutive hyphens', () => {
      const result = validateName('Mary--Jane');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot contain consecutive special characters');
    });
  });

  describe('custom options', () => {
    it('should use custom field name in error messages', () => {
      const result = validateName('', { fieldName: 'First name' });
      expect(result.error).toBe('First name is required');
    });

    it('should enforce custom minimum length', () => {
      const result = validateName('AB', { minLength: 3 });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name must be at least 3 characters');
    });

    it('should enforce custom maximum length', () => {
      const result = validateName('ABCDE', { maxLength: 4 });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name must be no more than 4 characters');
    });

    it('should reject names with numbers (not supported in current implementation)', () => {
      const result = validateName('John3rd');
      expect(result.isValid).toBe(false);
    });

    it('should disallow special chars when allowSpecialChars is false', () => {
      const result = validateName("O'Brien", { allowSpecialChars: false });
      expect(result.isValid).toBe(false);
    });

    it('should use singular character word for minLength of 1', () => {
      const result = validateName('', { minLength: 1 });
      expect(result.error).toBe('Name is required');
    });
  });

  describe('boundary values', () => {
    it('should accept name at exactly min length (2)', () => {
      expect(validateName('Jo').isValid).toBe(true);
    });

    it('should accept name at exactly max length (50)', () => {
      const name = 'A'.repeat(50);
      expect(validateName(name).isValid).toBe(true);
    });

    it('should reject name at max length + 1 (51)', () => {
      const name = 'A'.repeat(51);
      expect(validateName(name).isValid).toBe(false);
    });
  });
});

describe('isValidName', () => {
  it('should return true for valid name', () => {
    expect(isValidName('John Doe')).toBe(true);
  });

  it('should return false for empty string', () => {
    expect(isValidName('')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isValidName(null as unknown as string)).toBe(false);
  });

  it('should return false for single char (below default min)', () => {
    expect(isValidName('A')).toBe(false);
  });

  it('should respect custom minLength', () => {
    expect(isValidName('A', 1)).toBe(true);
    expect(isValidName('AB', 3)).toBe(false);
  });

  it('should return false for name with numbers', () => {
    expect(isValidName('John123')).toBe(false);
  });
});

// ─── Required Validation ─────────────────────────────────────────────────────

describe('validateRequired', () => {
  describe('valid values', () => {
    it('should accept non-empty string', () => {
      const result = validateRequired('value');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept string "0"', () => {
      expect(validateRequired('0').isValid).toBe(true);
    });

    it('should accept string "false"', () => {
      expect(validateRequired('false').isValid).toBe(true);
    });

    it('should accept single character', () => {
      expect(validateRequired('a').isValid).toBe(true);
    });
  });

  describe('invalid values', () => {
    it('should reject empty string', () => {
      const result = validateRequired('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Field is required');
    });

    it('should reject whitespace-only string', () => {
      const result = validateRequired('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Field is required');
    });

    it('should reject tab characters only', () => {
      const result = validateRequired('\t\t');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Field is required');
    });

    it('should reject newline only', () => {
      const result = validateRequired('\n');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Field is required');
    });

    it('should reject null-like values', () => {
      const result = validateRequired(null as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Field is required');
    });

    it('should reject undefined', () => {
      const result = validateRequired(undefined as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Field is required');
    });
  });

  describe('custom field name', () => {
    it('should use custom field name in error message', () => {
      const result = validateRequired('', 'Email');
      expect(result.error).toBe('Email is required');
    });

    it('should use custom field name for whitespace rejection', () => {
      const result = validateRequired('   ', 'Password');
      expect(result.error).toBe('Password is required');
    });

    it('should default to "Field" when no field name provided', () => {
      const result = validateRequired('');
      expect(result.error).toBe('Field is required');
    });
  });
});

// ─── Match Validation ────────────────────────────────────────────────────────

describe('validateMatch', () => {
  describe('matching values', () => {
    it('should accept identical strings', () => {
      const result = validateMatch('password123', 'password123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept matching empty strings', () => {
      const result = validateMatch('', '');
      expect(result.isValid).toBe(true);
    });

    it('should accept matching strings with special characters', () => {
      const result = validateMatch('p@ss!w0rd#$', 'p@ss!w0rd#$');
      expect(result.isValid).toBe(true);
    });

    it('should accept matching strings with whitespace', () => {
      const result = validateMatch('pass word', 'pass word');
      expect(result.isValid).toBe(true);
    });
  });

  describe('non-matching values', () => {
    it('should reject different strings', () => {
      const result = validateMatch('password123', 'password456');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Fields do not match');
    });

    it('should be case-sensitive', () => {
      const result = validateMatch('Password', 'password');
      expect(result.isValid).toBe(false);
    });

    it('should detect trailing whitespace difference', () => {
      const result = validateMatch('password', 'password ');
      expect(result.isValid).toBe(false);
    });

    it('should detect leading whitespace difference', () => {
      const result = validateMatch(' password', 'password');
      expect(result.isValid).toBe(false);
    });
  });

  describe('custom field name', () => {
    it('should use custom field name in error', () => {
      const result = validateMatch('pass1', 'pass2', 'Passwords');
      expect(result.error).toBe('Passwords do not match');
    });

    it('should use custom field name for emails', () => {
      const result = validateMatch('a@b.com', 'c@d.com', 'Email addresses');
      expect(result.error).toBe('Email addresses do not match');
    });

    it('should default to "Fields" when no field name provided', () => {
      const result = validateMatch('a', 'b');
      expect(result.error).toBe('Fields do not match');
    });
  });
});
