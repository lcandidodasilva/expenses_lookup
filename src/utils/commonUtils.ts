/**
 * Common utility functions for the application
 */

/**
 * Format a number as currency
 * @param amount The amount to format
 * @param currency The currency symbol (default: €)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = '€'): string {
  return `${currency}${amount.toFixed(2)}`;
}

/**
 * Format a date as a readable string
 * @param date The date to format
 * @param format The format to use (default: 'yyyy-MM-dd')
 * @returns Formatted date string
 */
export function formatDate(date: Date, format: string = 'yyyy-MM-dd'): string {
  // Simple implementation for demo purposes
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return format
    .replace('yyyy', year.toString())
    .replace('MM', month)
    .replace('dd', day);
}

/**
 * Truncate a string to a maximum length
 * @param str The string to truncate
 * @param maxLength The maximum length (default: 50)
 * @param suffix The suffix to add if truncated (default: '...')
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number = 50, suffix: string = '...'): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength) + suffix;
}

/**
 * Calculate the sum of an array of numbers
 * @param numbers Array of numbers to sum
 * @returns The sum
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((acc, num) => acc + num, 0);
}

/**
 * Group an array of objects by a key
 * @param array The array to group
 * @param key The key to group by
 * @returns An object with groups
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Debounce a function to limit how often it can be called
 * @param func The function to debounce
 * @param wait The wait time in ms
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
} 