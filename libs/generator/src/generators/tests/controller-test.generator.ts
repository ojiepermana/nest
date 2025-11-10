/**
 * Controller Test Generator
 *
 * Generates unit test files for controller classes with REST endpoint tests
 */

import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';
import { toPascalCase, toCamelCase } from '../../utils/string.util';

export interface ControllerTestGeneratorOptions {
  includeSwaggerTests?: boolean;
  includeValidationPipeTests?: boolean;
}

export class ControllerTestGenerator {
  constructor(private options: ControllerTestGeneratorOptions = {}) {
    this.options = {
      includeSwaggerTests: false,
      includeValidationPipeTests: true,
      ...options,
    };
  }

  /**
   * Generate controller test file
   */
  generateControllerTest(table: TableMetadata, columns: ColumnMetadata[]): string {
    const entityName = toPascalCase(table.table_name);
    const controllerName = `${entityName}Controller`;
    const serviceName = `${entityName}Service`;

    let testCode = this.generateFileHeader(table, controllerName);
    testCode += this.generateImports(entityName, controllerName, serviceName, table.table_name);
    testCode += this.generateDescribeBlock(controllerName, serviceName, entityName, table, columns);

    return testCode;
  }

  /**
   * Generate file header comment
   */
  private generateFileHeader(table: TableMetadata, controllerName: string): string {
    return `/**
 * ${controllerName} Unit Tests
 * Auto-generated test file for ${table.table_name} controller
 * 
 * @group unit
 * @group controller
 */

`;
  }

  /**
   * Generate imports
   */
  private generateImports(
    entityName: string,
    controllerName: string,
    serviceName: string,
    tableName: string,
  ): string {
    return `import { Test, TestingModule } from '@nestjs/testing';
import { ${controllerName} } from './${tableName}.controller';
import { ${serviceName} } from './${tableName}.service';

`;
  }

  /**
   * Generate main describe block
   */
  private generateDescribeBlock(
    controllerName: string,
    serviceName: string,
    entityName: string,
    table: TableMetadata,
    columns: ColumnMetadata[],
  ): string {
    const camelEntity = toCamelCase(entityName);

    let code = `describe('${controllerName}', () => {
  let controller: ${controllerName};
  let service: jest.Mocked<${serviceName}>;

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [${controllerName}],
      providers: [{ provide: ${serviceName}, useValue: mockService }],
    }).compile();

    controller = module.get<${controllerName}>(${controllerName});
    service = module.get(${serviceName});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // GENERATED_TEST_START: controller-defined
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  // GENERATED_TEST_END: controller-defined

`;

    // Add GET / (findAll) test
    code += this.generateFindAllEndpointTest(entityName, camelEntity);

    // Add GET / with pagination test
    code += this.generateFindAllPaginationEndpointTest(entityName, camelEntity);

    // Add GET /:id test
    code += this.generateFindOneEndpointTest(entityName, camelEntity, table.primary_key_column);

    // Add POST / test
    code += this.generateCreateEndpointTest(entityName, camelEntity, columns);

    // Add PUT /:id test
    code += this.generateUpdateEndpointTest(entityName, camelEntity, table.primary_key_column);

    // Add DELETE /:id test
    code += this.generateDeleteEndpointTest(entityName, camelEntity, table.primary_key_column);

    // Add custom tests section
    code += `  // CUSTOM_TESTS_START
  // Add your custom controller tests here
  // CUSTOM_TESTS_END
});
`;

    return code;
  }

  /**
   * Generate GET / (findAll) endpoint test
   */
  private generateFindAllEndpointTest(entityName: string, camelEntity: string): string {
    return `  // GENERATED_TEST_START: find-all-endpoint
  describe('GET /', () => {
    it('should return all ${camelEntity} records', async () => {
      const mock${entityName}s = [
        { id: '1', name: 'Test 1' },
        { id: '2', name: 'Test 2' },
      ];
      service.findAll.mockResolvedValue(mock${entityName}s);

      const result = await controller.findAll({});

      expect(result).toEqual(mock${entityName}s);
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });
  // GENERATED_TEST_END: find-all-endpoint

`;
  }

  /**
   * Generate GET / with pagination endpoint test
   */
  private generateFindAllPaginationEndpointTest(entityName: string, camelEntity: string): string {
    return `  // GENERATED_TEST_START: find-all-pagination-endpoint
  describe('GET / with pagination', () => {
    it('should return paginated ${camelEntity} records', async () => {
      const mockResponse = {
        data: [{ id: '1', name: 'Test 1' }],
        meta: { page: 1, limit: 10, total: 1 },
      };
      service.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll({}, 1, 10);

      expect(result).toEqual(mockResponse);
      expect(service.findAll).toHaveBeenCalledWith({}, 1, 10);
    });
  });
  // GENERATED_TEST_END: find-all-pagination-endpoint

`;
  }

  /**
   * Generate GET /:id endpoint test
   */
  private generateFindOneEndpointTest(
    entityName: string,
    camelEntity: string,
    primaryKeyColumn: string,
  ): string {
    return `  // GENERATED_TEST_START: find-one-endpoint
  describe('GET /:id', () => {
    it('should return ${camelEntity} by ${primaryKeyColumn}', async () => {
      const mock${entityName} = { ${primaryKeyColumn}: '123', name: 'Test' };
      service.findOne.mockResolvedValue(mock${entityName});

      const result = await controller.findOne('123');

      expect(result).toEqual(mock${entityName});
      expect(service.findOne).toHaveBeenCalledWith('123');
    });
  });
  // GENERATED_TEST_END: find-one-endpoint

`;
  }

  /**
   * Generate POST / endpoint test
   */
  private generateCreateEndpointTest(
    entityName: string,
    camelEntity: string,
    columns: ColumnMetadata[],
  ): string {
    const sampleColumn = columns.find(
      (col) =>
        !col.is_primary_key && col.column_name !== 'created_at' && col.column_name !== 'updated_at',
    );
    const fieldName = sampleColumn ? toCamelCase(sampleColumn.column_name) : 'name';
    const fieldValue = sampleColumn ? this.generateSampleValue(sampleColumn) : "'test'";

    return `  // GENERATED_TEST_START: create-endpoint
  describe('POST /', () => {
    it('should create new ${camelEntity}', async () => {
      const createDto = { ${fieldName}: ${fieldValue} };
      const mockCreated${entityName} = { id: '123', ...createDto };
      service.create.mockResolvedValue(mockCreated${entityName});

      const result = await controller.create(createDto);

      expect(result).toEqual(mockCreated${entityName});
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });
  // GENERATED_TEST_END: create-endpoint

`;
  }

  /**
   * Generate PUT /:id endpoint test
   */
  private generateUpdateEndpointTest(
    entityName: string,
    camelEntity: string,
    primaryKeyColumn: string,
  ): string {
    return `  // GENERATED_TEST_START: update-endpoint
  describe('PUT /:id', () => {
    it('should update ${camelEntity}', async () => {
      const updateDto = { name: 'Updated Name' };
      const mockUpdated${entityName} = { ${primaryKeyColumn}: '123', ...updateDto };
      service.update.mockResolvedValue(mockUpdated${entityName});

      const result = await controller.update('123', updateDto);

      expect(result).toEqual(mockUpdated${entityName});
      expect(service.update).toHaveBeenCalledWith('123', updateDto);
    });
  });
  // GENERATED_TEST_END: update-endpoint

`;
  }

  /**
   * Generate DELETE /:id endpoint test
   */
  private generateDeleteEndpointTest(
    entityName: string,
    camelEntity: string,
    primaryKeyColumn: string,
  ): string {
    return `  // GENERATED_TEST_START: delete-endpoint
  describe('DELETE /:id', () => {
    it('should delete ${camelEntity}', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete('123');

      expect(service.delete).toHaveBeenCalledWith('123');
    });
  });
  // GENERATED_TEST_END: delete-endpoint

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
