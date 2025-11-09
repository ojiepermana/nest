import {
  calculateChecksum,
  toPascalCase,
  toCamelCase,
  pluralize,
  singularize,
  isUUID,
  isValidIdentifier,
} from '../src/utils/string.util';

describe('String Utilities', () => {
  describe('calculateChecksum', () => {
    it('should generate consistent checksums', () => {
      const content = 'test content';
      const checksum1 = calculateChecksum(content);
      const checksum2 = calculateChecksum(content);
      expect(checksum1).toBe(checksum2);
    });

    it('should generate different checksums for different content', () => {
      const checksum1 = calculateChecksum('content1');
      const checksum2 = calculateChecksum('content2');
      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('toPascalCase', () => {
    it('should convert snake_case to PascalCase', () => {
      expect(toPascalCase('user_profile')).toBe('UserProfile');
      expect(toPascalCase('product_category')).toBe('ProductCategory');
      expect(toPascalCase('simple')).toBe('Simple');
    });
  });

  describe('toCamelCase', () => {
    it('should convert snake_case to camelCase', () => {
      expect(toCamelCase('user_profile')).toBe('userProfile');
      expect(toCamelCase('product_category')).toBe('productCategory');
      expect(toCamelCase('simple')).toBe('simple');
    });
  });

  describe('pluralize', () => {
    it('should pluralize words correctly', () => {
      expect(pluralize('user')).toBe('users');
      expect(pluralize('category')).toBe('categories');
      expect(pluralize('class')).toBe('classes');
    });
  });

  describe('singularize', () => {
    it('should singularize words correctly', () => {
      expect(singularize('users')).toBe('user');
      expect(singularize('categories')).toBe('category');
      expect(singularize('classes')).toBe('class');
    });
  });

  describe('isUUID', () => {
    it('should validate UUIDs', () => {
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isUUID('invalid-uuid')).toBe(false);
      expect(isUUID('not-a-uuid-at-all')).toBe(false);
    });
  });

  describe('isValidIdentifier', () => {
    it('should validate SQL identifiers', () => {
      expect(isValidIdentifier('user_table')).toBe(true);
      expect(isValidIdentifier('User123')).toBe(true);
      expect(isValidIdentifier('_private')).toBe(true);
      expect(isValidIdentifier('123invalid')).toBe(false);
      expect(isValidIdentifier('table-name')).toBe(false);
      expect(isValidIdentifier('DROP TABLE')).toBe(false);
    });
  });
});
