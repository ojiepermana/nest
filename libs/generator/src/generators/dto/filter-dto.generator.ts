/**
 * Filter DTO Generator
 *
 * Generates Filter DTO classes for query/search operations
 * Supports operators: _eq, _ne, _gt, _lt, _gte, _lte, _like, _in, _between, _null
 */

import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';
import { toPascalCase, toCamelCase } from '../../utils/string.util';
import { mapToTypeScriptType, getSwaggerDecorator } from './dto-mapper';

export interface FilterDtoGeneratorOptions {
  includeSwagger?: boolean;
  includeComments?: boolean;
  includeOperators?: boolean; // Generate operator fields like _eq, _like, etc.
}

const FILTER_OPERATORS = [
  { suffix: '_eq', description: 'Equal to', decorator: '@IsOptional()' },
  { suffix: '_ne', description: 'Not equal to', decorator: '@IsOptional()' },
  { suffix: '_gt', description: 'Greater than', decorator: '@IsOptional()' },
  {
    suffix: '_gte',
    description: 'Greater than or equal',
    decorator: '@IsOptional()',
  },
  { suffix: '_lt', description: 'Less than', decorator: '@IsOptional()' },
  {
    suffix: '_lte',
    description: 'Less than or equal',
    decorator: '@IsOptional()',
  },
  {
    suffix: '_like',
    description: 'Pattern match',
    decorator: '@IsOptional()\n  @IsString()',
  },
  {
    suffix: '_in',
    description: 'In array',
    decorator: '@IsOptional()\n  @IsArray()',
  },
  {
    suffix: '_between',
    description: 'Between two values',
    decorator: '@IsOptional()\n  @IsArray()\n  @ArrayMinSize(2)\n  @ArrayMaxSize(2)',
  },
  {
    suffix: '_null',
    description: 'Is null/not null',
    decorator: '@IsOptional()\n  @IsBoolean()',
  },
];

export class FilterDtoGenerator {
  constructor(private options: FilterDtoGeneratorOptions = {}) {
    this.options = {
      includeSwagger: true,
      includeComments: true,
      includeOperators: true,
      ...options,
    };
  }

  /**
   * Generate Filter DTO class
   */
  generate(table: TableMetadata, columns: ColumnMetadata[]): { code: string; imports: string[] } {
    const className = `Filter${toPascalCase(table.table_name)}Dto`;
    const filterableColumns = columns.filter((col) => col.is_filterable !== false);

    const enumDefinitions: string[] = [];
    const allDecorators: string[] = [];

    // Generate enum definitions
    filterableColumns.forEach((col) => {
      if (col.enum_values && col.enum_values.length > 0) {
        const enumName = `${toPascalCase(col.column_name)}Enum`;
        const enumValues = col.enum_values.map((val) => `  ${val} = '${val}'`).join(',\n');
        enumDefinitions.push(`export enum ${enumName} {\n${enumValues}\n}`);
      }
    });

    // Generate properties
    const properties: string[] = [];

    filterableColumns.forEach((col) => {
      const propertyName = toCamelCase(col.column_name);
      const tsType = mapToTypeScriptType(col.data_type);
      const typeAnnotation =
        col.enum_values && col.enum_values.length > 0
          ? `${toPascalCase(col.column_name)}Enum`
          : tsType;

      if (this.options.includeOperators) {
        // Generate operator-based properties
        FILTER_OPERATORS.forEach((operator) => {
          const opPropertyName = `${propertyName}${operator.suffix}`;
          const opType = this.getOperatorType(operator.suffix, typeAnnotation);

          let propertyCode = '';

          // Add comment
          if (this.options.includeComments) {
            const desc = col.description
              ? `${col.description} (${operator.description})`
              : operator.description;
            propertyCode += `  /**\n   * ${desc}\n   */\n`;
          }

          // Add Swagger decorator
          if (this.options.includeSwagger) {
            const swaggerDecorator = this.getFilterSwaggerDecorator(col, operator, opType);
            propertyCode += `  ${swaggerDecorator}\n`;
            allDecorators.push(swaggerDecorator);
          }

          // Add validation decorators
          const decorators = operator.decorator.split('\n  ');
          decorators.forEach((decorator) => {
            propertyCode += `  ${decorator}\n`;
            allDecorators.push(decorator);
          });

          // Add property
          propertyCode += `  ${opPropertyName}?: ${opType};\n`;

          properties.push(propertyCode);
        });
      } else {
        // Simple filter without operators
        let propertyCode = '';

        // Add comment
        if (this.options.includeComments && col.description) {
          propertyCode += `  /**\n   * ${col.description}\n   */\n`;
        }

        // Add Swagger decorator
        if (this.options.includeSwagger) {
          const swaggerDecorator = getSwaggerDecorator(col);
          propertyCode += `  ${swaggerDecorator}\n`;
          allDecorators.push(swaggerDecorator);
        }

        // Add @IsOptional decorator
        propertyCode += `  @IsOptional()\n`;
        allDecorators.push('@IsOptional()');

        // Add property
        propertyCode += `  ${propertyName}?: ${typeAnnotation};\n`;

        properties.push(propertyCode);
      }
    });

    // Add pagination fields
    const paginationFields = this.generatePaginationFields();
    properties.push(...paginationFields);

    // Add decorators for pagination fields
    allDecorators.push('@IsOptional()', '@IsInt()', '@Min()', '@Max()', '@IsString()');

    // Generate imports
    const imports = this.generateImports(allDecorators);

    // Generate class code
    let classCode = '';

    // Add file header comment
    if (this.options.includeComments) {
      classCode += `/**\n * Filter ${table.table_name} DTO\n * Auto-generated from metadata\n`;
      if (this.options.includeOperators) {
        classCode += ` * Supports query operators: ${FILTER_OPERATORS.map((op) => op.suffix).join(', ')}\n`;
      }
      classCode += ` */\n\n`;
    }

    // Add enum definitions
    if (enumDefinitions.length > 0) {
      classCode += enumDefinitions.join('\n\n') + '\n\n';
    }

    // Add class
    classCode += `export class ${className} {\n`;
    classCode += properties.join('\n');
    classCode += '}\n\n';

    // Add alias export for compatibility (FilterUsersDto and UsersFilterDto)
    const aliasName = `${toPascalCase(table.table_name)}FilterDto`;
    classCode += `// Export alias for compatibility\n`;
    classCode += `export { ${className} as ${aliasName} };\n`;

    return {
      code: classCode,
      imports,
    };
  }

  /**
   * Get TypeScript type for operator
   */
  private getOperatorType(operator: string, baseType: string): string {
    switch (operator) {
      case '_in':
        return `${baseType}[]`;
      case '_between':
        return `[${baseType}, ${baseType}]`;
      case '_null':
        return 'boolean';
      case '_like':
        return 'string';
      default:
        return baseType;
    }
  }

  /**
   * Generate pagination fields (page, limit, sort)
   */
  private generatePaginationFields(): string[] {
    const fields: string[] = [];

    // Page field
    fields.push(`  /**
   * Page number for pagination (default: 1)
   */
  @ApiProperty({
    description: 'Page number (default: 1)',
    required: false,
    type: 'number',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
`);

    // Limit field
    fields.push(`  /**
   * Number of items per page (default: 20, max: 100)
   */
  @ApiProperty({
    description: 'Items per page (default: 20, max: 100)',
    required: false,
    type: 'number',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
`);

    // Sort field
    fields.push(`  /**
   * Sort field and order (e.g., 'name:ASC' or 'created_at:DESC,name:ASC')
   */
  @ApiProperty({
    description: 'Sort field and order (e.g., name:ASC or created_at:DESC,name:ASC)',
    required: false,
    type: 'string',
    example: 'created_at:DESC',
  })
  @IsOptional()
  @IsString()
  sort?: string;
`);

    return fields;
  }

  /**
   * Get Swagger decorator for filter field
   */
  private getFilterSwaggerDecorator(
    column: ColumnMetadata,
    operator: { suffix: string; description: string },
    type: string,
  ): string {
    const description = column.description
      ? `${column.description} (${operator.description})`
      : operator.description;

    const props: string[] = [];
    props.push(`description: '${description}'`);
    props.push(`required: false`);

    // Fix type for arrays and tuples to be compatible with Swagger
    if (type.endsWith('[]')) {
      // Array type like 'string[]' -> type: [String]
      const baseType = type.slice(0, -2);
      const swaggerType =
        baseType === 'string'
          ? 'String'
          : baseType === 'number'
            ? 'Number'
            : baseType === 'boolean'
              ? 'Boolean'
              : baseType === 'Date'
                ? 'Date'
                : 'String';
      props.push(`type: [${swaggerType}]`);
    } else if (type.startsWith('[') && type.endsWith(']')) {
      // Tuple type like '[string, string]' -> use 'array'
      props.push(`type: 'array'`);
    } else if (type === 'Date') {
      // Date type -> use Date class
      props.push(`type: Date`);
    } else if (type === 'boolean') {
      // Boolean type -> use 'boolean'
      props.push(`type: 'boolean'`);
    } else if (type === 'number') {
      // Number type -> use 'number'
      props.push(`type: 'number'`);
    } else {
      props.push(`type: '${type}'`);
    }

    if (column.enum_values && column.enum_values.length > 0) {
      const enumName = `${toPascalCase(column.column_name)}Enum`;
      props.push(`enum: ${enumName}`);
    }

    return `@ApiProperty({ ${props.join(', ')} })`;
  }

  /**
   * Generate import statements
   */
  private generateImports(decorators: string[]): string[] {
    const imports: string[] = [];
    const validatorDecorators = new Set<string>();

    // Extract unique decorators
    decorators.forEach((decorator) => {
      const match = decorator.match(/@([A-Z][a-zA-Z]*)/);
      if (match) {
        const decoratorName = match[1];
        if (
          decoratorName.startsWith('Is') ||
          decoratorName === 'ArrayMinSize' ||
          decoratorName === 'ArrayMaxSize' ||
          decoratorName === 'Min' ||
          decoratorName === 'Max'
        ) {
          validatorDecorators.add(decoratorName);
        }
      }
    });

    // Class-validator imports
    if (validatorDecorators.size > 0) {
      imports.push(
        `import { ${Array.from(validatorDecorators).join(', ')} } from 'class-validator';`,
      );
    }

    // Class-transformer imports (for @Type decorator used in pagination)
    imports.push(`import { Type } from 'class-transformer';`);

    // Swagger imports
    if (this.options.includeSwagger && decorators.some((d) => d.includes('@ApiProperty'))) {
      imports.push(`import { ApiProperty } from '@nestjs/swagger';`);
    }

    return imports;
  }

  /**
   * Generate complete DTO file with imports and class
   */
  generateFile(table: TableMetadata, columns: ColumnMetadata[]): string {
    const { code, imports } = this.generate(table, columns);

    let fileContent = '';

    // Add imports
    if (imports.length > 0) {
      fileContent += imports.join('\n') + '\n\n';
    }

    // Add class code
    fileContent += code;

    return fileContent;
  }
}
