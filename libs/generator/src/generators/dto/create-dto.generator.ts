/**
 * Create DTO Generator
 *
 * Generates Create DTO classes from table metadata
 */

import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';
import { toPascalCase, toCamelCase } from '../../utils/string.util';
import {
  mapToTypeScriptType,
  getValidationDecorators,
  getRequiredImports,
  getSwaggerDecorator,
  shouldExcludeFromCreate,
} from './dto-mapper';

export interface CreateDtoGeneratorOptions {
  includeSwagger?: boolean;
  includeComments?: boolean;
}

export class CreateDtoGenerator {
  constructor(private options: CreateDtoGeneratorOptions = {}) {
    this.options = {
      includeSwagger: true,
      includeComments: true,
      ...options,
    };
  }

  /**
   * Generate Create DTO class
   */
  generate(
    table: TableMetadata,
    columns: ColumnMetadata[],
  ): { code: string; imports: string[] } {
    const className = `Create${toPascalCase(table.table_name)}Dto`;
    const formColumns = columns.filter((col) => !shouldExcludeFromCreate(col));

    // Collect all decorators to determine imports
    const allDecorators: string[] = [];
    const enumDefinitions: string[] = [];

    // Generate enum definitions
    formColumns.forEach((col) => {
      if (col.enum_values && col.enum_values.length > 0) {
        const enumName = `${toPascalCase(col.column_name)}Enum`;
        const enumValues = col.enum_values
          .map((val) => `  ${val} = '${val}'`)
          .join(',\n');
        enumDefinitions.push(`export enum ${enumName} {\n${enumValues}\n}`);
      }
    });

    // Generate class properties
    const properties = formColumns.map((col) => {
      const propertyName = toCamelCase(col.column_name);
      const tsType = mapToTypeScriptType(col.data_type);
      const decorators = getValidationDecorators(col);
      allDecorators.push(...decorators);

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

      // Add validation decorators
      decorators.forEach((decorator) => {
        propertyCode += `  ${decorator}\n`;
      });

      // Add property with optional marker for non-required fields
      const optional = !col.is_required ? '?' : '';
      const typeAnnotation =
        col.enum_values && col.enum_values.length > 0
          ? `${toPascalCase(col.column_name)}Enum`
          : tsType;

      propertyCode += `  ${propertyName}${optional}: ${typeAnnotation};\n`;

      return propertyCode;
    });

    // Generate imports
    const imports = this.generateImports(allDecorators);

    // Generate class code
    let classCode = '';

    // Add file header comment
    if (this.options.includeComments) {
      classCode += `/**\n * Create ${table.table_name} DTO\n * Auto-generated from metadata\n */\n\n`;
    }

    // Add enum definitions
    if (enumDefinitions.length > 0) {
      classCode += enumDefinitions.join('\n\n') + '\n\n';
    }

    // Add class
    classCode += `export class ${className} {\n`;
    classCode += properties.join('\n');
    classCode += '}\n';

    return {
      code: classCode,
      imports,
    };
  }

  /**
   * Generate import statements
   */
  private generateImports(decorators: string[]): string[] {
    const imports: string[] = [];
    const requiredImports = getRequiredImports(decorators);

    // Class-validator imports
    if (requiredImports.has('class-validator')) {
      const validatorDecorators = decorators
        .filter((d) => {
          const baseDecorator = d.split('(')[0];
          return (
            baseDecorator.startsWith('@Is') || baseDecorator.startsWith('@M')
          );
        })
        .map((d) => d.split('(')[0].substring(1))
        .filter((d, i, arr) => arr.indexOf(d) === i);

      if (validatorDecorators.length > 0) {
        imports.push(
          `import { ${validatorDecorators.join(', ')} } from 'class-validator';`,
        );
      }
    }

    // Class-transformer imports
    if (requiredImports.has('class-transformer')) {
      imports.push(`import { Type } from 'class-transformer';`);
    }

    // Swagger imports
    if (
      this.options.includeSwagger &&
      decorators.some((d) => d.includes('@ApiProperty'))
    ) {
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
