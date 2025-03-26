import { 
  formatCurrency, 
  formatDate, 
  truncateString, 
  sum, 
  groupBy, 
  debounce 
} from '@/utils/commonUtils';

describe('Common Utilities', () => {
  describe('formatCurrency', () => {
    it('should format a number as currency with default Euro symbol', () => {
      expect(formatCurrency(1234.56)).toBe('€1234.56');
      expect(formatCurrency(1000)).toBe('€1000.00');
      expect(formatCurrency(0)).toBe('€0.00');
    });

    it('should format a number as currency with specified symbol', () => {
      expect(formatCurrency(1234.56, '$')).toBe('$1234.56');
      expect(formatCurrency(1000, '£')).toBe('£1000.00');
    });
  });

  describe('formatDate', () => {
    it('should format a date with default format', () => {
      const date = new Date('2023-05-15');
      expect(formatDate(date)).toBe('2023-05-15');
    });

    it('should format a date with custom format', () => {
      const date = new Date('2023-05-15');
      expect(formatDate(date, 'MM/dd/yyyy')).toBe('05/15/2023');
      expect(formatDate(date, 'dd.MM.yyyy')).toBe('15.05.2023');
    });
  });

  describe('truncateString', () => {
    it('should not truncate strings shorter than maxLength', () => {
      expect(truncateString('Hello World', 20)).toBe('Hello World');
    });

    it('should truncate strings longer than maxLength', () => {
      expect(truncateString('This is a long string that should be truncated', 20)).toBe('This is a long strin...');
    });

    it('should use custom suffix when specified', () => {
      expect(truncateString('This should be truncated', 10, ' [more]')).toBe('This shoul [more]');
    });
  });

  describe('sum', () => {
    it('should calculate the sum of an array of numbers', () => {
      expect(sum([1, 2, 3, 4, 5])).toBe(15);
      expect(sum([10, -5, 3])).toBe(8);
    });

    it('should return 0 for an empty array', () => {
      expect(sum([])).toBe(0);
    });
  });

  describe('groupBy', () => {
    it('should group objects by a specified key', () => {
      const people = [
        { id: 1, name: 'Alice', category: 'A' },
        { id: 2, name: 'Bob', category: 'B' },
        { id: 3, name: 'Charlie', category: 'A' },
        { id: 4, name: 'David', category: 'C' },
        { id: 5, name: 'Eve', category: 'B' },
      ];

      const result = groupBy(people, 'category');

      expect(Object.keys(result)).toEqual(['A', 'B', 'C']);
      expect(result['A']).toHaveLength(2);
      expect(result['B']).toHaveLength(2);
      expect(result['C']).toHaveLength(1);
      expect(result['A'][0].name).toBe('Alice');
      expect(result['A'][1].name).toBe('Charlie');
    });

    it('should handle empty arrays', () => {
      expect(groupBy([], 'id')).toEqual({});
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce a function call', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);

      // Call the debounced function
      debouncedFn();
      
      // Function should not be called immediately
      expect(mockFn).not.toHaveBeenCalled();
      
      // Fast-forward time
      jest.advanceTimersByTime(1000);
      
      // Now the function should have been called
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should reset the timer on subsequent calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);

      // Call once
      debouncedFn();
      
      // Advance halfway
      jest.advanceTimersByTime(500);
      
      // Call again
      debouncedFn();
      
      // Advance halfway again (to original timeout)
      jest.advanceTimersByTime(500);
      
      // Function should not have been called yet
      expect(mockFn).not.toHaveBeenCalled();
      
      // Advance to new timeout
      jest.advanceTimersByTime(500);
      
      // Now the function should have been called once
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
}); 