/**
 * Validation utility functions
 */

/**
 * Check if a string is a valid email address
 * @param email Email to validate
 * @returns Whether the email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a string is a valid date in the format YYYY-MM-DD
 * @param dateString Date string to validate
 * @returns Whether the date string is valid
 */
export function isValidDateString(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Check if a number is within a specified range
 * @param value Number to validate
 * @param min Minimum value (inclusive)
 * @param max Maximum value (inclusive)
 * @returns Whether the number is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Check if a string contains only alphanumeric characters
 * @param str String to validate
 * @returns Whether the string is alphanumeric
 */
export function isAlphanumeric(str: string): boolean {
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  return alphanumericRegex.test(str);
}

/**
 * Check if a password is strong enough
 * Must be at least 8 characters long and contain at least one:
 * - Uppercase letter
 * - Lowercase letter
 * - Number
 * - Special character
 * @param password Password to validate
 * @returns Whether the password is strong
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8) {
    return false;
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

/**
 * Check if a string is a valid credit card number (using Luhn algorithm)
 * @param cardNumber Credit card number to validate
 * @returns Whether the credit card number is valid
 */
export function isValidCreditCard(cardNumber: string): boolean {
  // Remove spaces and dashes
  const sanitized = cardNumber.replace(/[\s-]/g, '');
  
  // Check if contains only digits
  if (!/^\d+$/.test(sanitized)) {
    return false;
  }
  
  // Luhn algorithm
  let sum = 0;
  let double = false;
  
  // Process from right to left
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    
    // Double every second digit
    if (double) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    double = !double;
  }
  
  // Valid if sum is divisible by 10
  return sum % 10 === 0;
} 