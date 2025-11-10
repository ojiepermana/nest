/**
 * Code Merge Service Tests
 */

import { CodeMergeService } from './code-merge.service';

describe('CodeMergeService', () => {
  let service: CodeMergeService;

  beforeEach(() => {
    service = new CodeMergeService();
  });

  describe('merge', () => {
    it('should preserve custom code blocks', async () => {
      const existing = `
class UserService {
  // GENERATED_START: find-all
  async findAll() {
    return [];
  }
  // GENERATED_END: find-all

  // CUSTOM_CODE_START: custom-logic
  async myCustomMethod() {
    return 'custom implementation';
  }
  // CUSTOM_CODE_END: custom-logic
}
`;

      const newTemplate = `
class UserService {
  // GENERATED_START: find-all
  async findAll() {
    return this.repository.findAll();
  }
  // GENERATED_END: find-all

  // CUSTOM_CODE_START: custom-logic
  // Add your custom methods here
  // CUSTOM_CODE_END: custom-logic
}
`;

      const result = await service.merge(existing, newTemplate, 'test.ts');

      expect(result.success).toBe(true);
      expect(result.customBlocksPreserved).toBe(1);
      expect(result.mergedContent).toContain('myCustomMethod');
      expect(result.mergedContent).toContain('this.repository.findAll()');
    });

    it('should update generated blocks', async () => {
      const existing = `
// GENERATED_START: create
async create(dto) {
  return oldImplementation();
}
// GENERATED_END: create
`;

      const newTemplate = `
// GENERATED_START: create
async create(dto: CreateDto) {
  return this.repository.create(dto);
}
// GENERATED_END: create
`;

      const result = await service.merge(existing, newTemplate, 'test.ts');

      expect(result.success).toBe(true);
      expect(result.generatedBlocksUpdated).toBe(1);
      expect(result.mergedContent).toContain('CreateDto');
      expect(result.mergedContent).not.toContain('oldImplementation');
    });

    it('should detect conflicts when custom block removed from template', async () => {
      const existing = `
// CUSTOM_CODE_START: removed-block
custom code that will be orphaned
// CUSTOM_CODE_END: removed-block
`;

      const newTemplate = `
// New template without the custom block
`;

      const result = await service.merge(existing, newTemplate, 'test.ts');

      expect(result.success).toBe(false);
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].type).toBe('missing_marker');
      expect(result.conflicts[0].blockName).toBe('removed-block');
    });

    it('should handle multiple custom blocks', async () => {
      const existing = `
// CUSTOM_CODE_START: block1
custom code 1
// CUSTOM_CODE_END: block1

// CUSTOM_CODE_START: block2
custom code 2
// CUSTOM_CODE_END: block2

// CUSTOM_CODE_START: block3
custom code 3
// CUSTOM_CODE_END: block3
`;

      const newTemplate = `
// CUSTOM_CODE_START: block1
// Template placeholder
// CUSTOM_CODE_END: block1

// CUSTOM_CODE_START: block2
// Template placeholder
// CUSTOM_CODE_END: block2

// CUSTOM_CODE_START: block3
// Template placeholder
// CUSTOM_CODE_END: block3
`;

      const result = await service.merge(existing, newTemplate, 'test.ts');

      expect(result.success).toBe(true);
      expect(result.customBlocksPreserved).toBe(3);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should handle empty custom blocks', async () => {
      const existing = `
// CUSTOM_CODE_START: empty-block
// CUSTOM_CODE_END: empty-block
`;

      const newTemplate = `
// CUSTOM_CODE_START: empty-block
// Add custom code here
// CUSTOM_CODE_END: empty-block
`;

      const result = await service.merge(existing, newTemplate, 'test.ts');

      expect(result.success).toBe(true);
      expect(result.customBlocksPreserved).toBe(1);
    });
  });

  describe('extractCustomCode', () => {
    it('should extract all custom blocks', () => {
      const content = `
// CUSTOM_CODE_START: block1
code 1
// CUSTOM_CODE_END: block1

// GENERATED_START: generated
generated code
// GENERATED_END: generated

// CUSTOM_CODE_START: block2
code 2
// CUSTOM_CODE_END: block2
`;

      const customBlocks = service.extractCustomCode(content);

      expect(customBlocks.size).toBe(2);
      expect(customBlocks.has('block1')).toBe(true);
      expect(customBlocks.has('block2')).toBe(true);
    });
  });

  describe('hasCustomCode', () => {
    it('should return true when custom code exists', () => {
      const content = `
// CUSTOM_CODE_START: test
custom code
// CUSTOM_CODE_END: test
`;

      expect(service.hasCustomCode(content)).toBe(true);
    });

    it('should return false when only generated code exists', () => {
      const content = `
// GENERATED_START: test
generated code
// GENERATED_END: test
`;

      expect(service.hasCustomCode(content)).toBe(false);
    });
  });

  describe('storeChecksums', () => {
    it('should store checksums for generated blocks', () => {
      const content = `
// GENERATED_START: block1
generated code 1
// GENERATED_END: block1

// GENERATED_START: block2
generated code 2
// GENERATED_END: block2
`;

      service.storeChecksums('test.ts', content);

      const checksums = service.getStoredChecksums();
      const fileChecksums = checksums.get('test.ts');

      expect(fileChecksums).toBeDefined();
      expect(fileChecksums!.size).toBe(2);
      expect(fileChecksums!.has('block1')).toBe(true);
      expect(fileChecksums!.has('block2')).toBe(true);
    });
  });

  describe('detectModifications', () => {
    it('should detect when generated block is modified', () => {
      const original = `
// GENERATED_START: test
original code
// GENERATED_END: test
`;

      service.storeChecksums('test.ts', original);

      const modified = `
// GENERATED_START: test
modified code
// GENERATED_END: test
`;

      const result = service.detectModifications('test.ts', modified);

      expect(result.modified).toBe(true);
      expect(result.modifiedBlocks).toContain('test');
    });

    it('should not detect modification when content unchanged', () => {
      const content = `
// GENERATED_START: test
same code
// GENERATED_END: test
`;

      service.storeChecksums('test.ts', content);

      const result = service.detectModifications('test.ts', content);

      expect(result.modified).toBe(false);
      expect(result.modifiedBlocks).toHaveLength(0);
    });
  });

  describe('getMergeStatistics', () => {
    it('should return statistics about merge', () => {
      const existing = `
// CUSTOM_CODE_START: custom1
custom
// CUSTOM_CODE_END: custom1

// GENERATED_START: gen1
generated
// GENERATED_END: gen1
`;

      const newContent = `
// CUSTOM_CODE_START: custom1
template
// CUSTOM_CODE_END: custom1

// GENERATED_START: gen1
new generated
// GENERATED_END: gen1
`;

      const stats = service.getMergeStatistics('test.ts', existing, newContent);

      expect(stats.totalBlocks).toBe(2);
      expect(stats.customBlocks).toBe(1);
      expect(stats.generatedBlocks).toBe(1);
      expect(stats.conflictingBlocks).toBe(0);
    });
  });

  describe('clearChecksums', () => {
    it('should clear checksums for specific file', () => {
      service.storeChecksums(
        'file1.ts',
        '// GENERATED_START: test\ncode\n// GENERATED_END: test',
      );
      service.storeChecksums(
        'file2.ts',
        '// GENERATED_START: test\ncode\n// GENERATED_END: test',
      );

      service.clearChecksums('file1.ts');

      const checksums = service.getStoredChecksums();
      expect(checksums.has('file1.ts')).toBe(false);
      expect(checksums.has('file2.ts')).toBe(true);
    });

    it('should clear all checksums when no file specified', () => {
      service.storeChecksums(
        'file1.ts',
        '// GENERATED_START: test\ncode\n// GENERATED_END: test',
      );
      service.storeChecksums(
        'file2.ts',
        '// GENERATED_START: test\ncode\n// GENERATED_END: test',
      );

      service.clearChecksums();

      const checksums = service.getStoredChecksums();
      expect(checksums.size).toBe(0);
    });
  });
});
