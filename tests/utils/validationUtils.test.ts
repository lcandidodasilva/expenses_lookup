import {
  isValidEmail,
  isValidDateString,
  isInRange,
  isAlphanumeric,
  isStrongPassword,
  isValidCreditCard
} from '@/utils/validationUtils';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('name.surname@domain.co.uk')).toBe(true);
      expect(isValidEmail('user123@company.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('plain-text')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('email with spaces@domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidDateString', () => {
    it('should validate correctly formatted date strings', () => {
      expect(isValidDateString('2023-01-15')).toBe(true);
      expect(isValidDateString('2022-12-31')).toBe(true);
      expect(isValidDateString('2024-02-29')).toBe(true); // Leap year
    });

    it('should reject incorrectly formatted date strings', () => {
      expect(isValidDateString('01-15-2023')).toBe(false); // Wrong format
      expect(isValidDateString('2023/01/15')).toBe(false); // Wrong separator
      expect(isValidDateString('2023-1-15')).toBe(false); // Missing leading zero
      expect(isValidDateString('2023-01-32')).toBe(false); // Invalid day
      expect(isValidDateString('2023-13-15')).toBe(false); // Invalid month
      expect(isValidDateString('abcd-ef-gh')).toBe(false); // Not a date
      expect(isValidDateString('')).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('should validate numbers within the specified range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true); // Min boundary
      expect(isInRange(10, 1, 10)).toBe(true); // Max boundary
    });

    it('should reject numbers outside the specified range', () => {
      expect(isInRange(0, 1, 10)).toBe(false); // Below min
      expect(isInRange(11, 1, 10)).toBe(false); // Above max
      expect(isInRange(-5, 0, 100)).toBe(false);
    });
  });

  describe('isAlphanumeric', () => {
    it('should validate strings containing only letters and numbers', () => {
      expect(isAlphanumeric('abc123')).toBe(true);
      expect(isAlphanumeric('ABC123')).toBe(true);
      expect(isAlphanumeric('123')).toBe(true);
      expect(isAlphanumeric('abc')).toBe(true);
    });

    it('should reject strings containing non-alphanumeric characters', () => {
      expect(isAlphanumeric('abc-123')).toBe(false);
      expect(isAlphanumeric('abc 123')).toBe(false); // Space
      expect(isAlphanumeric('abc_123')).toBe(false); // Underscore
      expect(isAlphanumeric('abc!')).toBe(false); // Special character
      expect(isAlphanumeric('')).toBe(false); // Empty string
    });
  });

  describe('isStrongPassword', () => {
    it('should validate strong passwords', () => {
      expect(isStrongPassword('P@ssw0rd')).toBe(true);
      expect(isStrongPassword('Str0ng!P@$$w0rd')).toBe(true);
      expect(isStrongPassword('1aB@aaaa')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isStrongPassword('password')).toBe(false); // No uppercase, number, or special char
      expect(isStrongPassword('PASSWORD')).toBe(false); // No lowercase or number
      expect(isStrongPassword('12345678')).toBe(false); // Only numbers
      expect(isStrongPassword('pass')).toBe(false); // Too short
      expect(isStrongPassword('Password')).toBe(false); // Missing number and special char
      expect(isStrongPassword('Password1')).toBe(false); // Missing special char
      expect(isStrongPassword('password!')).toBe(false); // Missing uppercase and number
    });
  });

  describe('isValidCreditCard', () => {
    it('should validate valid credit card numbers', () => {
      // Test data: Valid credit card numbers
      expect(isValidCreditCard('4111 1111 1111 1111')).toBe(true); // Visa
      expect(isValidCreditCard('5500-0000-0000-0004')).toBe(true); // MasterCard
      expect(isValidCreditCard('340000000000009')).toBe(true); // American Express
      expect(isValidCreditCard('6011000000000004')).toBe(true); // Discover
    });

    it('should reject invalid credit card numbers', () => {
      expect(isValidCreditCard('1234 5678 9012 3456')).toBe(false); // Invalid number
      expect(isValidCreditCard('4111-1111-1111-1112')).toBe(false); // Invalid checksum
      expect(isValidCreditCard('abcd efgh ijkl mnop')).toBe(false); // Not numeric
      expect(isValidCreditCard('')).toBe(false); // Empty string
    });
  });
}); 