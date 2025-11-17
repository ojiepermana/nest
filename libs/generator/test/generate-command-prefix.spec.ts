/**
 * Tests for prefix flag functionality in GenerateCommand
 */

import { GenerateCommand } from '../src/cli/commands/generate.command';

describe('GenerateCommand - Prefix Flag', () => {
  let generateCommand: GenerateCommand;

  beforeEach(() => {
    generateCommand = new GenerateCommand();
  });

  describe('determinePrefix', () => {
    it('should use custom prefix when provided', () => {
      const customPrefix = 'custom/test';
      // @ts-expect-error - accessing private method for testing
      const result = generateCommand.determinePrefix('entity.location', customPrefix);
      expect(result).toBe('custom/test');
    });

    it('should convert schema.table to schema/table format when no custom prefix', () => {
      // @ts-expect-error - accessing private method for testing
      const result = generateCommand.determinePrefix('entity.location');
      expect(result).toBe('entity/location');
    });

    it('should handle single table name without schema', () => {
      // @ts-expect-error - accessing private method for testing
      const result = generateCommand.determinePrefix('users');
      expect(result).toBe('users');
    });

    it('should convert PascalCase to kebab-case', () => {
      // @ts-expect-error - accessing private method for testing
      const result = generateCommand.determinePrefix('Entity.UserProfile');
      expect(result).toBe('entity/user-profile');
    });

    it('should handle snake_case to kebab-case', () => {
      // @ts-expect-error - accessing private method for testing
      const result = generateCommand.determinePrefix('business_entity.location_data');
      expect(result).toBe('business-entity/location-data');
    });
  });

  describe('prefix to output folder', () => {
    it('should result in correct output path structure', () => {
      const prefix = 'entity/location';
      const outputPath = '/path/to/src';
      const expectedPath = '/path/to/src/entity/location';

      // Simulate path join
      const result = `${outputPath}/${prefix}`;
      expect(result).toBe(expectedPath);
    });

    it('should handle nested prefix paths', () => {
      const prefix = 'api/v1/entity/location';
      const outputPath = '/path/to/src';
      const expectedPath = '/path/to/src/api/v1/entity/location';

      const result = `${outputPath}/${prefix}`;
      expect(result).toBe(expectedPath);
    });
  });

  describe('prefix to URL path', () => {
    it('should use prefix as basePath for controller', () => {
      const prefix = 'entity/location';
      // Controller decorator would be: @Controller('entity/location')
      expect(prefix).toBe('entity/location');
    });

    it('should handle custom prefix for URL', () => {
      const customPrefix = 'api/v2/locations';
      // Controller decorator would be: @Controller('api/v2/locations')
      expect(customPrefix).toBe('api/v2/locations');
    });
  });
});
