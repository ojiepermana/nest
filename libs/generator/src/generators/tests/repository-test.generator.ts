/**
 * Repository Test Generator
 *
 * Generates unit test files for repository classes with mocked database queries
 */

import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';
import { toPascalCase, toCamelCase } from '../../utils/string.util';

export interface RepositoryTestGeneratorOptions {
  includeTransactionTests?: boolean;
  includeBulkOperationTests?: boolean;
}

export class RepositoryTestGenerator {
  constructor(private options: RepositoryTestGeneratorOptions = {}) {
    this.options = {
      includeTransactionTests: false,
      includeBulkOperationTests: false,
      ...options,
    };
  }

  /**
   * Generate repository test file
   */
  generateRepositoryTest(
    table: TableMetadata,
    columns: ColumnMetadata[],
  ): string {
    const entityName = toPascalCase(table.table_name);
    const repositoryName = `${entityName}Repository`;

    let testCode = this.generateFileHeader(table, repositoryName);
    testCode += this.generateImports(entityName, repositoryName, table.table_name);
    testCode += this.generateDescribeBlock(
      repositoryName,
      entityName,
      table,
      columns,
    );

    return testCode;
  }

  /**
   * Generate file header comment
   */
  private generateFileHeader(
    table: TableMetadata,
    repositoryName: string,
  ): string {
    return `/**
 * ${repositoryName} Unit Tests
 * Auto-generated test file for ${table.table_name} repository
 * 
 * @group unit
 * @group repository
 */

`;
  }

  /**
   * Generate imports
   */
  private generateImports(
    entityName: string,
    repositoryName: string,
    tableName: string,
  ): string {
    return `import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { ${repositoryName} } from './${tableName}.repository';
import { ${entityName}FilterDto } from './${tableName}.dto';

`;
  }

  /**
   * Generate main describe block
   */
  private generateDescribeBlock(
    repositoryName: string,
    entityName: string,
    table: TableMetadata,
    columns: ColumnMetadata[],
  ): string {
    const camelEntity = toCamelCase(entityName);
    const filterableColumns = columns.filter((col) => col.is_filterable);

    let code = `describe('${repositoryName}', () => {
  let repository: ${repositoryName};
  let mockPool: jest.Mocked<Pool>;

  beforeEach(async () => {
    mockPool = {
      query: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ${repositoryName},
        { provide: Pool, useValue: mockPool },
      ],
    }).compile();

    repository = module.get<${repositoryName}>(${repositoryName});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

`;

    // Add findAll test
    code += this.generateFindAllTest(entityName, camelEntity, table);

    // Add findAll with filters test
    if (filterableColumns.length > 0) {
      code += this.generateFindAllWithFiltersTest(
        entityName,
        camelEntity,
        filterableColumns[0],
      );
    }

    // Add soft delete test
    if (table.has_soft_delete) {
      code += this.generateSoftDeleteExclusionTest(entityName, camelEntity);
    }

    // Add findOne test
    code += this.generateFindOneTest(
      entityName,
      camelEntity,
      table.primary_key_column,
    );

    // Add findOne not found test
    code += this.generateFindOneNotFoundTest(
      entityName,
      camelEntity,
      table.primary_key_column,
    );

    // Add create test
    code += this.generateCreateTest(entityName, camelEntity, columns);

    // Add update test
    code += this.generateUpdateTest(
      entityName,
      camelEntity,
      table.primary_key_column,
    );

    // Add delete/soft delete test
    if (table.has_soft_delete) {
      code += this.generateSoftDeleteTest(
        entityName,
        camelEntity,
        table.primary_key_column,
      );
    } else {
      code += this.generateHardDeleteTest(
        entityName,
        camelEntity,
        table.primary_key_column,
      );
    }

    // Add bulk operations tests if enabled
    if (this.options.includeBulkOperationTests) {
      code += this.generateBulkCreateTest(entityName, camelEntity);
      code += this.generateBulkUpdateTest(entityName, camelEntity);
    }

    // Add custom tests section
    code += `  // CUSTOM_TESTS_START
  // Add your custom repository tests here
  // CUSTOM_TESTS_END
});
`;

    return code;
  }

  /**
   * Generate findAll test
   */
  private generateFindAllTest(
    entityName: string,
    camelEntity: string,
    table: TableMetadata,
  ): string {
    return `  // GENERATED_TEST_START: find-all
  describe('findAll', () => {
    it('should return all ${camelEntity} records without filters', async () => {
      const mock${entityName}s = [
        { id: '1', name: 'Test 1' },
        { id: '2', name: 'Test 2' },
      ];
      mockPool.query.mockResolvedValue({ rows: mock${entityName}s } as any);

      const result = await repository.findAll();

      expect(result).toEqual(mock${entityName}s);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM "${table.schema_name}"."${table.table_name}"'),
        expect.any(Array),
      );
    });
  });
  // GENERATED_TEST_END: find-all

`;
  }

  /**
   * Generate findAll with filters test
   */
  private generateFindAllWithFiltersTest(
    entityName: string,
    camelEntity: string,
    sampleColumn: ColumnMetadata,
  ): string {
    const filterField = toCamelCase(sampleColumn.column_name);
    const operator =
      sampleColumn.data_type === 'varchar' || sampleColumn.data_type === 'text'
        ? 'ILIKE'
        : '=';
    const filterValue =
      sampleColumn.data_type === 'varchar' || sampleColumn.data_type === 'text'
        ? `%test%`
        : 'test';

    return `  // GENERATED_TEST_START: find-all-with-filters
  describe('findAll with filters', () => {
    it('should apply filters correctly', async () => {
      const filters: ${entityName}FilterDto = { ${filterField}_${operator === 'ILIKE' ? 'like' : 'eq'}: '${filterValue}' };
      const mock${entityName}s = [{ id: '1', ${filterField}: 'test' }];
      mockPool.query.mockResolvedValue({ rows: mock${entityName}s } as any);

      const result = await repository.findAll(filters);

      expect(result).toEqual(mock${entityName}s);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('${sampleColumn.column_name}'),
        expect.arrayContaining(['${filterValue}']),
      );
    });
  });
  // GENERATED_TEST_END: find-all-with-filters

`;
  }

  /**
   * Generate soft delete exclusion test
   */
  private generateSoftDeleteExclusionTest(
    entityName: string,
    camelEntity: string,
  ): string {
    return `  // GENERATED_TEST_START: soft-delete-exclusion
  describe('soft delete exclusion', () => {
    it('should exclude soft-deleted records from findAll', async () => {
      mockPool.query.mockResolvedValue({ rows: [] } as any);

      await repository.findAll();

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at IS NULL'),
        expect.any(Array),
      );
    });
  });
  // GENERATED_TEST_END: soft-delete-exclusion

`;
  }

  /**
   * Generate findOne test
   */
  private generateFindOneTest(
    entityName: string,
    camelEntity: string,
    primaryKeyColumn: string,
  ): string {
    return `  // GENERATED_TEST_START: find-one
  describe('findOne', () => {
    it('should return a ${camelEntity} by ${primaryKeyColumn}', async () => {
      const mock${entityName} = { ${primaryKeyColumn}: '123', name: 'Test' };
      mockPool.query.mockResolvedValue({ rows: [mock${entityName}] } as any);

      const result = await repository.findOne('123');

      expect(result).toEqual(mock${entityName});
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ${primaryKeyColumn} = $1'),
        ['123'],
      );
    });
  });
  // GENERATED_TEST_END: find-one

`;
  }

  /**
   * Generate findOne not found test
   */
  private generateFindOneNotFoundTest(
    entityName: string,
    camelEntity: string,
    primaryKeyColumn: string,
  ): string {
    return `  // GENERATED_TEST_START: find-one-not-found
  describe('findOne not found', () => {
    it('should return null when ${camelEntity} not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] } as any);

      const result = await repository.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });
  // GENERATED_TEST_END: find-one-not-found

`;
  }

  /**
   * Generate create test
   */
  private generateCreateTest(
    entityName: string,
    camelEntity: string,
    columns: ColumnMetadata[],
  ): string {
    const sampleColumn = columns.find(
      (col) =>
        !col.is_primary_key &&
        col.column_name !== 'created_at' &&
        col.column_name !== 'updated_at',
    );
    const fieldName = sampleColumn ? toCamelCase(sampleColumn.column_name) : 'name';
    const fieldValue = sampleColumn
      ? this.generateSampleValue(sampleColumn)
      : "'test'";

    return `  // GENERATED_TEST_START: create
  describe('create', () => {
    it('should insert new ${camelEntity} and return it', async () => {
      const createDto = { ${fieldName}: ${fieldValue} };
      const mockCreated${entityName} = { id: '123', ...createDto };
      mockPool.query.mockResolvedValue({ rows: [mockCreated${entityName}] } as any);

      const result = await repository.create(createDto);

      expect(result).toEqual(mockCreated${entityName});
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        expect.arrayContaining([${fieldValue}]),
      );
    });
  });
  // GENERATED_TEST_END: create

`;
  }

  /**
   * Generate update test
   */
  private generateUpdateTest(
    entityName: string,
    camelEntity: string,
    primaryKeyColumn: string,
  ): string {
    return `  // GENERATED_TEST_START: update
  describe('update', () => {
    it('should update existing ${camelEntity}', async () => {
      const updateDto = { name: 'Updated Name' };
      const mockUpdated${entityName} = { ${primaryKeyColumn}: '123', ...updateDto };
      mockPool.query.mockResolvedValue({ rows: [mockUpdated${entityName}] } as any);

      const result = await repository.update('123', updateDto);

      expect(result).toEqual(mockUpdated${entityName});
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(['Updated Name', '123']),
      );
    });
  });
  // GENERATED_TEST_END: update

`;
  }

  /**
   * Generate soft delete test
   */
  private generateSoftDeleteTest(
    entityName: string,
    camelEntity: string,
    primaryKeyColumn: string,
  ): string {
    return `  // GENERATED_TEST_START: soft-delete
  describe('softDelete', () => {
    it('should soft delete ${camelEntity} by setting deleted_at', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 } as any);

      await repository.softDelete('123');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.stringContaining('deleted_at = CURRENT_TIMESTAMP'),
        ['123'],
      );
    });
  });
  // GENERATED_TEST_END: soft-delete

`;
  }

  /**
   * Generate hard delete test
   */
  private generateHardDeleteTest(
    entityName: string,
    camelEntity: string,
    primaryKeyColumn: string,
  ): string {
    return `  // GENERATED_TEST_START: hard-delete
  describe('delete', () => {
    it('should permanently delete ${camelEntity}', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 } as any);

      await repository.delete('123');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM'),
        ['123'],
      );
    });
  });
  // GENERATED_TEST_END: hard-delete

`;
  }

  /**
   * Generate bulk create test
   */
  private generateBulkCreateTest(
    entityName: string,
    camelEntity: string,
  ): string {
    return `  // GENERATED_TEST_START: bulk-create
  describe('bulkCreate', () => {
    it('should insert multiple ${camelEntity} records', async () => {
      const createDtos = [
        { name: 'Item 1' },
        { name: 'Item 2' },
      ];
      const mockCreated = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];
      mockPool.query.mockResolvedValue({ rows: mockCreated } as any);

      const result = await repository.bulkCreate(createDtos);

      expect(result).toEqual(mockCreated);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        expect.any(Array),
      );
    });
  });
  // GENERATED_TEST_END: bulk-create

`;
  }

  /**
   * Generate bulk update test
   */
  private generateBulkUpdateTest(
    entityName: string,
    camelEntity: string,
  ): string {
    return `  // GENERATED_TEST_START: bulk-update
  describe('bulkUpdate', () => {
    it('should update multiple ${camelEntity} records', async () => {
      const updates = [
        { id: '1', name: 'Updated 1' },
        { id: '2', name: 'Updated 2' },
      ];
      mockPool.query.mockResolvedValue({ rowCount: 2 } as any);

      await repository.bulkUpdate(updates);

      expect(mockPool.query).toHaveBeenCalled();
    });
  });
  // GENERATED_TEST_END: bulk-update

`;
  }

  /**
   * Generate sample value for testing
   */
  private generateSampleValue(col: ColumnMetadata): string {
    switch (col.data_type) {
      case 'varchar':
      case 'text':
      case 'char':
        return `'test-${toCamelCase(col.column_name)}'`;

      case 'integer':
      case 'bigint':
      case 'smallint':
        return '1';

      case 'numeric':
      case 'decimal':
      case 'float':
      case 'double':
        return '1.5';

      case 'boolean':
        return 'true';

      case 'uuid':
        return `'123e4567-e89b-12d3-a456-426614174000'`;

      default:
        return `'test-value'`;
    }
  }
}
