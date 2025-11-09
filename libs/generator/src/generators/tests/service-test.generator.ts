/**
 * Service Test Generator
 *
 * Generates unit test files for service classes with business logic validation
 */

import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';
import { toPascalCase, toCamelCase } from '../../utils/string.util';

export interface ServiceTestGeneratorOptions {
  includeErrorHandlingTests?: boolean;
  includePaginationTests?: boolean;
}

export class ServiceTestGenerator {
  constructor(private options: ServiceTestGeneratorOptions = {}) {
    this.options = {
      includeErrorHandlingTests: true,
      includePaginationTests: true,
      ...options,
    };
  }

  /**
   * Generate service test file
   */
  generateServiceTest(
    table: TableMetadata,
    columns: ColumnMetadata[],
  ): string {
    const entityName = toPascalCase(table.table_name);
    const serviceName = `${entityName}Service`;
    const repositoryName = `${entityName}Repository`;

    let testCode = this.generateFileHeader(table, serviceName);
    testCode += this.generateImports(
      entityName,
      serviceName,
      repositoryName,
      table.table_name,
    );
    testCode += this.generateDescribeBlock(
      serviceName,
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
  private generateFileHeader(table: TableMetadata, serviceName: string): string {
    return `/**
 * ${serviceName} Unit Tests
 * Auto-generated test file for ${table.table_name} service
 * 
 * @group unit
 * @group service
 */

`;
  }

  /**
   * Generate imports
   */
  private generateImports(
    entityName: string,
    serviceName: string,
    repositoryName: string,
    tableName: string,
  ): string {
    return `import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ${serviceName} } from './${tableName}.service';
import { ${repositoryName} } from './${tableName}.repository';

`;
  }

  /**
   * Generate main describe block
   */
  private generateDescribeBlock(
    serviceName: string,
    repositoryName: string,
    entityName: string,
    table: TableMetadata,
    columns: ColumnMetadata[],
  ): string {
    const camelEntity = toCamelCase(entityName);

    let code = `describe('${serviceName}', () => {
  let service: ${serviceName};
  let repository: jest.Mocked<${repositoryName}>;

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      ${table.has_soft_delete ? 'softDelete' : 'delete'}: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ${serviceName},
        { provide: ${repositoryName}, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<${serviceName}>(${serviceName});
    repository = module.get(${repositoryName});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

`;

    // Add findAll test
    code += this.generateFindAllTest(entityName, camelEntity);

    // Add findAll with pagination test
    if (this.options.includePaginationTests) {
      code += this.generateFindAllPaginationTest(entityName, camelEntity);
    }

    // Add findOne success test
    code += this.generateFindOneSuccessTest(
      entityName,
      camelEntity,
      table.primary_key_column,
    );

    // Add findOne not found test
    if (this.options.includeErrorHandlingTests) {
      code += this.generateFindOneNotFoundTest(
        entityName,
        camelEntity,
        table.primary_key_column,
      );
    }

    // Add create test
    code += this.generateCreateTest(entityName, camelEntity, columns);

    // Add create validation test
    if (this.options.includeErrorHandlingTests) {
      code += this.generateCreateValidationTest(entityName, camelEntity);
    }

    // Add update test
    code += this.generateUpdateTest(
      entityName,
      camelEntity,
      table.primary_key_column,
    );

    // Add update not found test
    if (this.options.includeErrorHandlingTests) {
      code += this.generateUpdateNotFoundTest(
        entityName,
        camelEntity,
        table.primary_key_column,
      );
    }

    // Add delete test
    code += this.generateDeleteTest(
      entityName,
      camelEntity,
      table.primary_key_column,
      table.has_soft_delete,
    );

    // Add delete not found test
    if (this.options.includeErrorHandlingTests) {
      code += this.generateDeleteNotFoundTest(
        entityName,
        camelEntity,
        table.primary_key_column,
      );
    }

    // Add custom tests section
    code += `  // CUSTOM_TESTS_START
  // Add your custom service tests here
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
  ): string {
    return `  // GENERATED_TEST_START: find-all
  describe('findAll', () => {
    it('should return all ${camelEntity} records', async () => {
      const mock${entityName}s = [
        { id: '1', name: 'Test 1' },
        { id: '2', name: 'Test 2' },
      ];
      repository.findAll.mockResolvedValue(mock${entityName}s);

      const result = await service.findAll({});

      expect(result).toEqual(mock${entityName}s);
      expect(repository.findAll).toHaveBeenCalledWith({});
    });
  });
  // GENERATED_TEST_END: find-all

`;
  }

  /**
   * Generate findAll with pagination test
   */
  private generateFindAllPaginationTest(
    entityName: string,
    camelEntity: string,
  ): string {
    return `  // GENERATED_TEST_START: find-all-pagination
  describe('findAll with pagination', () => {
    it('should return paginated ${camelEntity} records', async () => {
      const mock${entityName}s = [{ id: '1', name: 'Test 1' }];
      repository.findAll.mockResolvedValue(mock${entityName}s);

      const result = await service.findAll({}, 1, 10);

      expect(result.data).toEqual(mock${entityName}s);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
      });
      expect(repository.findAll).toHaveBeenCalledWith({}, 1, 10);
    });
  });
  // GENERATED_TEST_END: find-all-pagination

`;
  }

  /**
   * Generate findOne success test
   */
  private generateFindOneSuccessTest(
    entityName: string,
    camelEntity: string,
    primaryKeyColumn: string,
  ): string {
    return `  // GENERATED_TEST_START: find-one-success
  describe('findOne', () => {
    it('should return ${camelEntity} when found', async () => {
      const mock${entityName} = { ${primaryKeyColumn}: '123', name: 'Test' };
      repository.findOne.mockResolvedValue(mock${entityName});

      const result = await service.findOne('123');

      expect(result).toEqual(mock${entityName});
      expect(repository.findOne).toHaveBeenCalledWith('123');
    });
  });
  // GENERATED_TEST_END: find-one-success

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
    it('should throw NotFoundException when ${camelEntity} not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        '${entityName} not found',
      );
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
    const fieldName = sampleColumn
      ? toCamelCase(sampleColumn.column_name)
      : 'name';
    const fieldValue = sampleColumn
      ? this.generateSampleValue(sampleColumn)
      : "'test'";

    return `  // GENERATED_TEST_START: create
  describe('create', () => {
    it('should create and return new ${camelEntity}', async () => {
      const createDto = { ${fieldName}: ${fieldValue} };
      const mockCreated${entityName} = { id: '123', ...createDto };
      repository.create.mockResolvedValue(mockCreated${entityName});

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreated${entityName});
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });
  });
  // GENERATED_TEST_END: create

`;
  }

  /**
   * Generate create validation test
   */
  private generateCreateValidationTest(
    entityName: string,
    camelEntity: string,
  ): string {
    return `  // GENERATED_TEST_START: create-validation
  describe('create validation', () => {
    it('should throw BadRequestException on validation error', async () => {
      const invalidDto = {}; // Missing required fields
      repository.create.mockRejectedValue(new BadRequestException('Validation failed'));

      await expect(service.create(invalidDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
  // GENERATED_TEST_END: create-validation

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
    it('should update and return ${camelEntity}', async () => {
      const updateDto = { name: 'Updated Name' };
      const existing${entityName} = { ${primaryKeyColumn}: '123', name: 'Old Name' };
      const mockUpdated${entityName} = { ${primaryKeyColumn}: '123', ...updateDto };
      
      repository.findOne.mockResolvedValue(existing${entityName});
      repository.update.mockResolvedValue(mockUpdated${entityName});

      const result = await service.update('123', updateDto);

      expect(result).toEqual(mockUpdated${entityName});
      expect(repository.findOne).toHaveBeenCalledWith('123');
      expect(repository.update).toHaveBeenCalledWith('123', updateDto);
    });
  });
  // GENERATED_TEST_END: update

`;
  }

  /**
   * Generate update not found test
   */
  private generateUpdateNotFoundTest(
    entityName: string,
    camelEntity: string,
    primaryKeyColumn: string,
  ): string {
    return `  // GENERATED_TEST_START: update-not-found
  describe('update not found', () => {
    it('should throw NotFoundException when updating non-existent ${camelEntity}', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  // GENERATED_TEST_END: update-not-found

`;
  }

  /**
   * Generate delete test
   */
  private generateDeleteTest(
    entityName: string,
    camelEntity: string,
    primaryKeyColumn: string,
    hasSoftDelete: boolean,
  ): string {
    const deleteMethod = hasSoftDelete ? 'softDelete' : 'delete';
    const deleteAction = hasSoftDelete ? 'soft delete' : 'delete';

    return `  // GENERATED_TEST_START: delete
  describe('${deleteMethod}', () => {
    it('should ${deleteAction} ${camelEntity}', async () => {
      const existing${entityName} = { ${primaryKeyColumn}: '123', name: 'Test' };
      repository.findOne.mockResolvedValue(existing${entityName});
      repository.${deleteMethod}.mockResolvedValue(undefined);

      await service.delete('123');

      expect(repository.findOne).toHaveBeenCalledWith('123');
      expect(repository.${deleteMethod}).toHaveBeenCalledWith('123');
    });
  });
  // GENERATED_TEST_END: delete

`;
  }

  /**
   * Generate delete not found test
   */
  private generateDeleteNotFoundTest(
    entityName: string,
    camelEntity: string,
    primaryKeyColumn: string,
  ): string {
    return `  // GENERATED_TEST_START: delete-not-found
  describe('delete not found', () => {
    it('should throw NotFoundException when deleting non-existent ${camelEntity}', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  // GENERATED_TEST_END: delete-not-found

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
