import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Test, TestingModule } from '@nestjs/testing';
import { GeneratorService } from './generator.service';
import { TableMetadata } from './types';
import { normalizeWhitespace } from './utils';

describe('GeneratorService', () => {
  let service: GeneratorService;
  let metadata: TableMetadata;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneratorService],
    }).compile();

    service = module.get<GeneratorService>(GeneratorService);
    metadata = {
      schema: 'public',
      table: 'users',
      columns: [
        {
          name: 'id',
          dbType: 'uuid',
          tsType: 'string',
          isNullable: false,
          isPrimaryKey: true,
          hasDefault: true,
          comment: 'Primary identifier',
          isGenerated: true,
        },
        {
          name: 'username',
          dbType: 'character varying',
          tsType: 'string',
          isNullable: false,
          isPrimaryKey: false,
          hasDefault: false,
          comment: 'Username of the account',
        },
        {
          name: 'age',
          dbType: 'integer',
          tsType: 'number',
          isNullable: true,
          isPrimaryKey: false,
          hasDefault: false,
        },
      ],
      primaryKey: {
        name: 'id',
        dbType: 'uuid',
        tsType: 'string',
        isNullable: false,
        isPrimaryKey: true,
        hasDefault: true,
        comment: 'Primary identifier',
        isGenerated: true,
      },
      uniqueColumns: ['id'],
      hasTimestamps: false,
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate module artifacts in dry run', async () => {
    const outputPath = mkdtempSync(join(tmpdir(), 'generator-test-'));
    const result = await service.generateModule({
      schema: 'public',
      table: 'users',
      metadata,
      dryRun: true,
      outputPath,
    });

    expect(result.moduleName).toBe('users');
    expect(result.files).toHaveLength(7);
    expect(result.writtenFiles).toHaveLength(0);
    expect(result.metadata.columns).toHaveLength(metadata.columns.length);
  });

  it('should write files and preserve custom sections', async () => {
    const outputPath = mkdtempSync(join(tmpdir(), 'generator-write-'));
    const targetDirectory = join(outputPath, 'src', 'modules', 'users');

    const firstRun = await service.generateModule({
      schema: 'public',
      table: 'users',
      metadata,
      outputPath,
    });

    expect(firstRun.writtenFiles.length).toBeGreaterThan(0);
    const repositoryPath = join(targetDirectory, 'users.repository.ts');
    const originalContent = readFileSync(repositoryPath, 'utf8');

    const preservedContent = originalContent.replace(
      /\/\/ <generator-preserve repository\.custom-methods>[\s\S]*?\/\/ <\/generator-preserve repository\.custom-methods>/,
      `// <generator-preserve repository.custom-methods>\n  // custom repository logic\n  async countAll(): Promise<number> {\n    const result = await this.pool.query('SELECT COUNT(*) FROM users');\n    return Number(result.rows[0].count);\n  }\n// </generator-preserve repository.custom-methods>`,
    );
    writeFileSync(repositoryPath, preservedContent, 'utf8');

    const secondRun = await service.generateModule({
      schema: 'public',
      table: 'users',
      metadata,
      outputPath,
    });

    const regeneratedContent = readFileSync(repositoryPath, 'utf8');
    const normalized = normalizeWhitespace(regeneratedContent);
    expect(normalized).toContain('custom repository logic');
    expect(normalized).toContain('async countAll(): Promise<number>');

    const metadataFile = join(outputPath, '.crud-generator', 'metadata.json');
    expect(existsSync(metadataFile)).toBe(true);
  });
});
