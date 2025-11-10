/**
 * Recap DTO Generator
 *
 * Generates yearly recap DTO with validation for year and group_by parameters
 */

import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';
import { toPascalCase, toCamelCase } from '../../utils/string.util';

export interface RecapDtoGeneratorOptions {
  includeSwagger?: boolean;
  includeComments?: boolean;
}

export class RecapDtoGenerator {
  constructor(private options: RecapDtoGeneratorOptions = {}) {
    this.options = {
      includeSwagger: true,
      includeComments: true,
      ...options,
    };
  }

  /**
   * Generate Recap DTO class
   */
  generate(table: TableMetadata, columns: ColumnMetadata[]): { code: string; imports: string[] } {
    const className = `${toPascalCase(table.table_name)}RecapDto`;
    const filterableColumns = columns.filter((col) => col.is_filterable);

    // Generate class code
    const code = `${this.generateImports()}

${this.generateRecapDto(className, filterableColumns)}

${this.generateRecapResultInterface(table)}
`;

    const imports = ['class-validator', 'class-transformer', '@nestjs/swagger'];

    return { code, imports };
  }

  /**
   * Generate imports
   */
  private generateImports(): string {
    return `import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
`;
  }

  /**
   * Generate Recap DTO class
   */
  private generateRecapDto(className: string, filterableColumns: ColumnMetadata[]): string {
    const filterProperties = this.generateFilterProperties(filterableColumns);

    return `/**
 * DTO for yearly recap query
 * Supports grouping by up to 2 fields with monthly breakdown
 */
export class ${className} {
  @ApiProperty({
    description: 'Target year for recap',
    example: 2024,
    minimum: 2000,
    maximum: 2100,
  })
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year: number;

  @ApiPropertyOptional({
    description: 'Fields to group by (comma-separated, max 2 fields)',
    example: 'department,role',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*(,[a-zA-Z_][a-zA-Z0-9_]*)?$/, {
    message: 'group_by must be valid field names separated by comma (max 2)',
  })
  @Transform(({ value }) => value?.toLowerCase())
  group_by?: string;

${filterProperties}
}`;
  }

  /**
   * Generate filter properties from filterable columns
   */
  private generateFilterProperties(columns: ColumnMetadata[]): string {
    if (columns.length === 0) {
      return '  // CUSTOM_FILTER_START: additional-filters\n  // Add custom filter properties here\n  // CUSTOM_FILTER_END: additional-filters';
    }

    const properties = columns
      .map((col) => {
        const propertyName = `${toCamelCase(col.column_name)}_eq`;
        const tsType = this.mapToTypeScriptType(col.data_type);

        return `  @ApiPropertyOptional({
    description: 'Filter by ${col.column_name} (exact match)',
    example: ${this.getExampleValue(col)},
  })
  @IsOptional()
  @IsString()
  ${propertyName}?: ${tsType};`;
      })
      .join('\n\n');

    return `${properties}

  // CUSTOM_FILTER_START: additional-filters
  // Add custom filter properties here
  // CUSTOM_FILTER_END: additional-filters`;
  }

  /**
   * Generate RecapResult interface
   */
  private generateRecapResultInterface(table: TableMetadata): string {
    return `/**
 * Recap result interface
 * Contains grouped data with monthly breakdown
 */
export interface ${toPascalCase(table.table_name)}RecapResult {
  /** Main grouping field value */
  main: string;
  
  /** Sub-grouping field value (if two fields grouping) */
  sub?: string;
  
  /** Monthly data breakdown */
  monthly: {
    jan: number;
    feb: number;
    mar: number;
    apr: number;
    may: number;
    jun: number;
    jul: number;
    aug: number;
    sep: number;
    oct: number;
    nov: number;
    dec: number;
  };
  
  /** Total count for the year */
  total: number;
}`;
  }

  /**
   * Map database type to TypeScript type
   */
  private mapToTypeScriptType(dataType: string): string {
    const type = dataType.toLowerCase();
    if (
      type.includes('int') ||
      type.includes('float') ||
      type.includes('double') ||
      type.includes('decimal')
    ) {
      return 'string'; // For filter, we use string then parse
    }
    if (type.includes('bool')) return 'string';
    if (type.includes('date') || type.includes('time')) return 'string';
    if (type === 'uuid') return 'string';
    return 'string';
  }

  /**
   * Get example value for Swagger
   */
  private getExampleValue(col: ColumnMetadata): string {
    if (col.swagger_example) {
      return `'${col.swagger_example}'`;
    }

    const type = col.data_type.toLowerCase();
    if (type.includes('int')) return "'100'";
    if (type.includes('bool')) return "'true'";
    if (type === 'uuid') return "'123e4567-e89b-12d3-a456-426614174000'";
    if (col.enum_values && col.enum_values.length > 0) {
      return `'${col.enum_values[0]}'`;
    }
    return "'example'";
  }
}
