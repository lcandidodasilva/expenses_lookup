// Simple utility tests without complex dependencies

describe('Simple utilities', () => {
  // Test basic string manipulation
  describe('String utilities', () => {
    it('should concatenate strings', () => {
      const result = 'Hello' + ' ' + 'World';
      expect(result).toBe('Hello World');
    });

    it('should convert strings to lowercase', () => {
      const result = 'HELLO WORLD'.toLowerCase();
      expect(result).toBe('hello world');
    });
  });

  // Test basic array operations
  describe('Array utilities', () => {
    it('should filter arrays', () => {
      const numbers = [1, 2, 3, 4, 5];
      const evenNumbers = numbers.filter(n => n % 2 === 0);
      expect(evenNumbers).toEqual([2, 4]);
    });

    it('should map arrays', () => {
      const numbers = [1, 2, 3];
      const doubled = numbers.map(n => n * 2);
      expect(doubled).toEqual([2, 4, 6]);
    });
  });

  // Test basic object operations
  describe('Object utilities', () => {
    it('should merge objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { c: 3, d: 4 };
      const merged = { ...obj1, ...obj2 };
      expect(merged).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    it('should extract object keys', () => {
      const obj = { name: 'John', age: 30, city: 'New York' };
      const keys = Object.keys(obj);
      expect(keys).toEqual(['name', 'age', 'city']);
    });
  });

  // Test basic async operations
  describe('Async utilities', () => {
    it('should resolve promises', async () => {
      const promise = Promise.resolve('success');
      const result = await promise;
      expect(result).toBe('success');
    });

    it('should handle promise chains', async () => {
      const result = await Promise.resolve(5)
        .then(num => num * 2)
        .then(num => num + 1);
      expect(result).toBe(11);
    });
  });
}); 