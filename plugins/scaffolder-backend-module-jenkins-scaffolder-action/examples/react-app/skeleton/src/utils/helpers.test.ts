// filepath: src/utils/helpers.test.ts
import {
  validateEmail,
  validatePassword,
  validateName,
  formatDate,
  formatDateTime,
  debounce,
  capitalize,
  toTitleCase,
  truncate,
  isEmpty,
  deepClone,
  formatCurrency,
  calculatePercentage,
  clamp,
  formatBytes,
} from './helpers';

describe('Helper Functions', () => {
  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('user123@test-domain.com')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
      expect(validatePassword('MySecure2024@')).toBe(true);
    });

    it('rejects weak passwords', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('onlylowercase')).toBe(false);
      expect(validatePassword('ONLYUPPERCASE')).toBe(false);
      expect(validatePassword('NoSpecialChar123')).toBe(false);
    });
  });

  describe('validateName', () => {
    it('validates correct names', () => {
      expect(validateName('John Doe')).toBe(true);
      expect(validateName('Jane')).toBe(true);
      expect(validateName('Mary Jane Watson')).toBe(true);
    });

    it('rejects invalid names', () => {
      expect(validateName('A')).toBe(false); // Too short
      expect(validateName('John123')).toBe(false); // Contains numbers
      expect(validateName('')).toBe(false); // Empty
    });
  });

  describe('formatDate', () => {
    it('formats date strings correctly', () => {
      const date = '2024-01-15T10:30:00Z';
      const formatted = formatDate(date);
      expect(formatted).toMatch(/January 15, 2024/);
    });

    it('formats Date objects correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/January 15, 2024/);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('delays function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('cancels previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      jest.advanceTimersByTime(500);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  describe('capitalize', () => {
    it('capitalizes first letter and lowercases rest', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
      expect(capitalize('tEST')).toBe('Test');
    });

    it('handles empty strings', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('toTitleCase', () => {
    it('converts strings to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
      expect(toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox');
    });
  });

  describe('truncate', () => {
    it('truncates long strings', () => {
      const longString = 'This is a very long string that should be truncated';
      expect(truncate(longString, 10)).toBe('This is a ...');
    });

    it('does not truncate short strings', () => {
      const shortString = 'Short';
      expect(truncate(shortString, 10)).toBe('Short');
    });
  });

  describe('isEmpty', () => {
    it('detects empty values', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it('detects non-empty values', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty({ key: 'value' })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('deepClone', () => {
    it('clones primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });

    it('clones arrays', () => {
      const original = [1, 2, [3, 4]];
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[2]).not.toBe(original[2]);
    });

    it('clones objects', () => {
      const original = {
        name: 'John',
        age: 30,
        address: {
          city: 'New York',
          country: 'USA',
        },
      };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.address).not.toBe(original.address);
    });

    it('clones dates', () => {
      const original = new Date('2024-01-15');
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });
  });

  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(1234.56)).toMatch(/\$1,234\.56/);
      expect(formatCurrency(0)).toMatch(/\$0\.00/);
    });
  });

  describe('calculatePercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(25, 200)).toBe(13);
      expect(calculatePercentage(0, 100)).toBe(0);
    });

    it('handles division by zero', () => {
      expect(calculatePercentage(50, 0)).toBe(0);
    });
  });

  describe('clamp', () => {
    it('clamps values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('formatBytes', () => {
    it('formats bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('handles decimal places', () => {
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(1536, 0)).toBe('2 KB');
    });
  });
});
