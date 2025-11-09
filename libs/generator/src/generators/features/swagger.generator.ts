/**
 * Swagger Documentation Generator
 *
 * Generates comprehensive Swagger/OpenAPI documentation
 * with examples, schemas, and detailed descriptions
 */

import { toPascalCase } from '../../utils/string.util';
import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';

export interface SwaggerGeneratorOptions {
  tableName: string;
  apiVersion?: string;
  includeExamples?: boolean;
  includeSchemas?: boolean;
}

export class SwaggerGenerator {
  constructor(
    private tableMetadata: TableMetadata,
    private columns: ColumnMetadata[],
    private options: SwaggerGeneratorOptions,
  ) {}

  /**
   * Generate Swagger decorators for controller
   */
  generateControllerDecorators(): string {
    const entityName = toPascalCase(this.options.tableName);

    return `@ApiTags('${this.options.tableName}')
@ApiBearerAuth()
@ApiExtraModels(Create${entityName}Dto, Update${entityName}Dto, ${entityName}FilterDto)`;
  }

  /**
   * Generate Swagger decorators for endpoints
   */
  generateEndpointDecorators(
    method: 'findAll' | 'findOne' | 'create' | 'update' | 'remove' | 'recap',
  ): string {
    const entityName = toPascalCase(this.options.tableName);

    switch (method) {
      case 'findAll':
        return this.generateFindAllDecorators(entityName);
      case 'findOne':
        return this.generateFindOneDecorators(entityName);
      case 'create':
        return this.generateCreateDecorators(entityName);
      case 'update':
        return this.generateUpdateDecorators(entityName);
      case 'remove':
        return this.generateRemoveDecorators(entityName);
      case 'recap':
        return this.generateRecapDecorators(entityName);
      default:
        return '';
    }
  }

  /**
   * Generate findAll decorators
   */
  private generateFindAllDecorators(entityName: string): string {
    const example = this.generateExample();

    return `  @ApiOperation({
    summary: 'Get all ${this.options.tableName}',
    description: 'Retrieve a paginated list of ${this.options.tableName} with optional filtering',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  ${this.generateFilterQueries()}
  @ApiResponse({
    status: 200,
    description: 'List of ${this.options.tableName} retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { \$ref: '#/components/schemas/${entityName}' },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
      },
    },
    examples: {
      success: {
        value: {
          data: [${example}],
          total: 100,
          page: 1,
          limit: 20,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })`;
  }

  /**
   * Generate findOne decorators
   */
  private generateFindOneDecorators(entityName: string): string {
    const example = this.generateExample();

    return `  @ApiOperation({
    summary: 'Get single ${this.options.tableName}',
    description: 'Retrieve a single ${this.options.tableName} by ID',
  })
  @ApiParam({ name: 'id', type: 'string', description: '${entityName} ID' })
  @ApiResponse({
    status: 200,
    description: '${entityName} found',
    schema: { \$ref: '#/components/schemas/${entityName}' },
    examples: {
      success: { value: ${example} },
    },
  })
  @ApiResponse({ status: 404, description: '${entityName} not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })`;
  }

  /**
   * Generate create decorators
   */
  private generateCreateDecorators(entityName: string): string {
    const example = this.generateExample();

    return `  @ApiOperation({
    summary: 'Create ${this.options.tableName}',
    description: 'Create a new ${this.options.tableName} record',
  })
  @ApiBody({ type: Create${entityName}Dto })
  @ApiResponse({
    status: 201,
    description: '${entityName} created successfully',
    schema: { \$ref: '#/components/schemas/${entityName}' },
    examples: {
      success: { value: ${example} },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })`;
  }

  /**
   * Generate update decorators
   */
  private generateUpdateDecorators(entityName: string): string {
    const example = this.generateExample();

    return `  @ApiOperation({
    summary: 'Update ${this.options.tableName}',
    description: 'Update an existing ${this.options.tableName} record',
  })
  @ApiParam({ name: 'id', type: 'string', description: '${entityName} ID' })
  @ApiBody({ type: Update${entityName}Dto })
  @ApiResponse({
    status: 200,
    description: '${entityName} updated successfully',
    schema: { \$ref: '#/components/schemas/${entityName}' },
    examples: {
      success: { value: ${example} },
    },
  })
  @ApiResponse({ status: 404, description: '${entityName} not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })`;
  }

  /**
   * Generate remove decorators
   */
  private generateRemoveDecorators(entityName: string): string {
    return `  @ApiOperation({
    summary: 'Delete ${this.options.tableName}',
    description: 'Delete a ${this.options.tableName} record${this.tableMetadata.has_soft_delete ? ' (soft delete)' : ''}',
  })
  @ApiParam({ name: 'id', type: 'string', description: '${entityName} ID' })
  @ApiResponse({
    status: 200,
    description: '${entityName} deleted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '${entityName} not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })`;
  }

  /**
   * Generate recap decorators
   */
  private generateRecapDecorators(entityName: string): string {
    return `  @ApiOperation({
    summary: 'Get yearly recap',
    description: 'Get yearly statistics with monthly breakdown and grouping',
  })
  @ApiQuery({ name: 'year', required: true, type: Number, example: 2024 })
  @ApiQuery({ name: 'group_by', required: false, type: String, example: 'department,role' })
  @ApiResponse({
    status: 200,
    description: 'Recap data retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          main: { type: 'string' },
          sub: { type: 'string' },
          monthly: {
            type: 'object',
            properties: {
              jan: { type: 'number' },
              feb: { type: 'number' },
              mar: { type: 'number' },
              apr: { type: 'number' },
              may: { type: 'number' },
              jun: { type: 'number' },
              jul: { type: 'number' },
              aug: { type: 'number' },
              sep: { type: 'number' },
              oct: { type: 'number' },
              nov: { type: 'number' },
              dec: { type: 'number' },
            },
          },
          total: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })`;
  }

  /**
   * Generate filter queries for Swagger
   */
  private generateFilterQueries(): string {
    const filterableColumns = this.columns.filter((col) => col.is_filterable);
    const queries = filterableColumns.slice(0, 5).map((col) => {
      const example = this.getExampleValue(col);
      return `  @ApiQuery({ name: '${col.column_name}_eq', required: false, type: String, example: '${example}' })`;
    });

    return queries.join('\n');
  }

  /**
   * Generate example response object
   */
  private generateExample(): string {
    const exampleObj: Record<string, any> = {};

    this.columns
      .filter((col) => col.display_in_list || col.display_in_detail)
      .forEach((col) => {
        exampleObj[col.column_name] = this.getExampleValue(col);
      });

    return JSON.stringify(exampleObj, null, 2);
  }

  /**
   * Get example value for column
   */
  private getExampleValue(col: ColumnMetadata): string {
    if (col.swagger_example) return col.swagger_example;

    const type = col.data_type.toLowerCase();
    if (type.includes('int')) return '1';
    if (type.includes('bool')) return 'true';
    if (type === 'uuid') return '123e4567-e89b-12d3-a456-426614174000';
    if (type.includes('date') || type.includes('time'))
      return '2024-01-01T00:00:00Z';
    if (col.enum_values && col.enum_values.length > 0)
      return col.enum_values[0];
    return `example_${col.column_name}`;
  }

  /**
   * Generate Swagger imports
   */
  generateImports(): string {
    return `import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';`;
  }
}
