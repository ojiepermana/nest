/**
 * Block Marker Parser Tests
 */

import { BlockMarkerParser } from './block-marker-parser';

describe('BlockMarkerParser', () => {
  let parser: BlockMarkerParser;

  beforeEach(() => {
    parser = new BlockMarkerParser();
  });

  describe('parseFile', () => {
    it('should parse custom code blocks', () => {
      const content = `
class UserService {
  // CUSTOM_CODE_START: business-logic
  async customMethod() {
    return 'custom';
  }
  // CUSTOM_CODE_END: business-logic
}
`;

      const result = parser.parseFile('test.ts', content);

      expect(result.customBlocks.size).toBe(1);
      expect(result.customBlocks.has('business-logic')).toBe(true);
      
      const block = result.customBlocks.get('business-logic')!;
      expect(block.type).toBe('custom');
      expect(block.content).toContain('customMethod');
    });

    it('should parse generated code blocks', () => {
      const content = `
class UserRepository {
  // GENERATED_START: find-all
  async findAll() {
    return [];
  }
  // GENERATED_END: find-all
}
`;

      const result = parser.parseFile('test.ts', content);

      expect(result.generatedBlocks.size).toBe(1);
      expect(result.generatedBlocks.has('find-all')).toBe(true);
    });

    it('should parse multiple blocks', () => {
      const content = `
class UserService {
  // GENERATED_START: find-all
  async findAll() {}
  // GENERATED_END: find-all

  // CUSTOM_CODE_START: custom-method
  async custom() {}
  // CUSTOM_CODE_END: custom-method

  // GENERATED_START: create
  async create() {}
  // GENERATED_END: create
}
`;

      const result = parser.parseFile('test.ts', content);

      expect(result.blocks.length).toBe(3);
      expect(result.customBlocks.size).toBe(1);
      expect(result.generatedBlocks.size).toBe(2);
    });

    it('should handle blocks without explicit end marker name', () => {
      const content = `
// CUSTOM_CODE_START: block1
custom code here
// CUSTOM_CODE_END
`;

      const result = parser.parseFile('test.ts', content);

      expect(result.customBlocks.size).toBe(1);
      expect(result.customBlocks.has('block1')).toBe(true);
    });
  });

  describe('hasCustomCode', () => {
    it('should return true when custom code exists', () => {
      const content = `
// CUSTOM_CODE_START: test
custom code
// CUSTOM_CODE_END: test
`;

      expect(parser.hasCustomCode(content)).toBe(true);
    });

    it('should return false when no custom code exists', () => {
      const content = `
// GENERATED_START: test
generated code
// GENERATED_END: test
`;

      expect(parser.hasCustomCode(content)).toBe(false);
    });
  });

  describe('extractCustomBlocks', () => {
    it('should extract only custom blocks', () => {
      const content = `
// CUSTOM_CODE_START: block1
custom code 1
// CUSTOM_CODE_END: block1

// GENERATED_START: generated
generated code
// GENERATED_END: generated

// CUSTOM_CODE_START: block2
custom code 2
// CUSTOM_CODE_END: block2
`;

      const blocks = parser.extractCustomBlocks(content);

      expect(blocks.size).toBe(2);
      expect(blocks.has('block1')).toBe(true);
      expect(blocks.has('block2')).toBe(true);
      expect(blocks.get('block1')).toContain('custom code 1');
      expect(blocks.get('block2')).toContain('custom code 2');
    });
  });

  describe('generateCustomBlockMarkers', () => {
    it('should generate start and end markers', () => {
      const markers = parser.generateCustomBlockMarkers('test-block');

      expect(markers.start).toBe('// CUSTOM_CODE_START: test-block');
      expect(markers.end).toBe('// CUSTOM_CODE_END: test-block');
    });
  });

  describe('generateGeneratedBlockMarkers', () => {
    it('should generate start and end markers', () => {
      const markers = parser.generateGeneratedBlockMarkers('find-all');

      expect(markers.start).toBe('// GENERATED_START: find-all');
      expect(markers.end).toBe('// GENERATED_END: find-all');
    });
  });

  describe('validateMarkers', () => {
    it('should validate correctly matched markers', () => {
      const content = `
// CUSTOM_CODE_START: block1
code
// CUSTOM_CODE_END: block1
`;

      const result = parser.validateMarkers(content);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unclosed blocks', () => {
      const content = `
// CUSTOM_CODE_START: block1
code without end
`;

      const result = parser.validateMarkers(content);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Unclosed');
    });

    it('should detect mismatched block types', () => {
      const content = `
// CUSTOM_CODE_START: block1
code
// GENERATED_END: block1
`;

      const result = parser.validateMarkers(content);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Mismatched'))).toBe(true);
    });

    it('should detect end marker without start', () => {
      const content = `
// CUSTOM_CODE_END: block1
`;

      const result = parser.validateMarkers(content);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('without start'))).toBe(true);
    });
  });
});
