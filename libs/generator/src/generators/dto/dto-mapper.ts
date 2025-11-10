/**
 * DTO Mapper
 *
 * Maps database column metadata to TypeScript types and validation decorators
 */

import type { ColumnMetadata } from '../../interfaces/generator.interface';

/**
 * Map database data type to TypeScript type
 */
export function mapToTypeScriptType(dataType: string): string {
  const type = dataType.toLowerCase();

  // Numeric types
  if (type.includes('int') || type.includes('serial')) return 'number';
  if (type.includes('numeric') || type.includes('decimal')) return 'number';
  if (type.includes('float') || type.includes('double')) return 'number';
  if (type.includes('real')) return 'number';

  // String types
  if (type.includes('char') || type.includes('text')) return 'string';
  if (type.includes('varchar')) return 'string';

  // Boolean
  if (type.includes('bool') || type === 'tinyint(1)') return 'boolean';

  // Date/Time
  if (type.includes('timestamp') || type.includes('datetime')) return 'Date';
  if (type.includes('date')) return 'Date';
  if (type.includes('time')) return 'string';

  // UUID
  if (type === 'uuid') return 'string';

  // JSON
  if (type === 'json' || type === 'jsonb') return 'any';

  // Arrays
  if (type.includes('[]')) return 'any[]';

  // Binary
  if (type.includes('bytea') || type.includes('blob')) return 'Buffer';

  return 'any';
}

/**
 * Get validation decorators for a column
 */
export function getValidationDecorators(column: ColumnMetadata): string[] {
  const decorators: string[] = [];
  const tsType = mapToTypeScriptType(column.data_type);

  // Required validation (for create DTO)
  if (column.is_required && !column.is_primary_key) {
    decorators.push('@IsNotEmpty()');
  }

  // Type-based decorators
  if (tsType === 'string') {
    decorators.push('@IsString()');

    // Max length validation
    if (column.max_length) {
      decorators.push(`@MaxLength(${column.max_length})`);
    }

    // Email validation
    if (
      column.column_name.toLowerCase().includes('email') ||
      column.data_type.toLowerCase() === 'email'
    ) {
      decorators.push('@IsEmail()');
    }

    // URL validation
    if (column.column_name.toLowerCase().includes('url')) {
      decorators.push('@IsUrl()');
    }
  }

  if (tsType === 'number') {
    decorators.push('@IsNumber()');

    // Min/Max validation
    if (column.min_value !== undefined) {
      decorators.push(`@Min(${column.min_value})`);
    }
    if (column.max_value !== undefined) {
      decorators.push(`@Max(${column.max_value})`);
    }
  }

  if (tsType === 'boolean') {
    decorators.push('@IsBoolean()');
  }

  if (tsType === 'Date') {
    decorators.push('@IsDate()');
    decorators.push('@Type(() => Date)');
  }

  if (column.data_type === 'uuid') {
    decorators.push('@IsUUID()');
  }

  // Enum validation
  if (column.enum_values && column.enum_values.length > 0) {
    const enumName = `${column.column_name.charAt(0).toUpperCase()}${column.column_name.slice(1)}Enum`;
    decorators.push(`@IsEnum(${enumName})`);
  }

  // Array validation
  if (tsType.includes('[]')) {
    decorators.push('@IsArray()');
  }

  // Optional validation (for update DTO)
  if (!column.is_required) {
    decorators.push('@IsOptional()');
  }

  // Custom validation rules from metadata
  if (column.validation_rules) {
    const rules = column.validation_rules;

    if (rules.minLength) {
      decorators.push(`@MinLength(${rules.minLength})`);
    }
    if (rules.maxLength) {
      decorators.push(`@MaxLength(${rules.maxLength})`);
    }
    if (rules.pattern) {
      decorators.push(`@Matches(/${rules.pattern}/)`);
    }
    if (rules.isAlphanumeric) {
      decorators.push('@IsAlphanumeric()');
    }
    if (rules.isUpperCase) {
      decorators.push('@IsUppercase()');
    }
    if (rules.isLowerCase) {
      decorators.push('@IsLowercase()');
    }
  }

  return decorators;
}

/**
 * Get required imports for decorators
 */
export function getRequiredImports(decorators: string[]): Set<string> {
  const imports = new Set<string>();

  const decoratorMap: Record<string, string> = {
    '@IsNotEmpty': 'class-validator',
    '@IsString': 'class-validator',
    '@IsNumber': 'class-validator',
    '@IsBoolean': 'class-validator',
    '@IsDate': 'class-validator',
    '@IsEmail': 'class-validator',
    '@IsUrl': 'class-validator',
    '@IsUUID': 'class-validator',
    '@IsEnum': 'class-validator',
    '@IsArray': 'class-validator',
    '@IsOptional': 'class-validator',
    '@MinLength': 'class-validator',
    '@MaxLength': 'class-validator',
    '@Min': 'class-validator',
    '@Max': 'class-validator',
    '@Matches': 'class-validator',
    '@IsAlphanumeric': 'class-validator',
    '@IsUppercase': 'class-validator',
    '@IsLowercase': 'class-validator',
    '@Type': 'class-transformer',
  };

  decorators.forEach((decorator) => {
    const baseDecorator = decorator.split('(')[0];
    const importFrom = decoratorMap[baseDecorator];
    if (importFrom) {
      imports.add(importFrom);
    }
  });

  return imports;
}

/**
 * Get Swagger/ApiProperty decorator
 */
export function getSwaggerDecorator(column: ColumnMetadata): string {
  const options: string[] = [];

  if (column.description) {
    options.push(`description: '${column.description.replace(/'/g, "\\'")}'`);
  }

  if (column.swagger_example) {
    options.push(`example: ${column.swagger_example}`);
  }

  const tsType = mapToTypeScriptType(column.data_type);
  if (tsType === 'string') {
    options.push(`type: 'string'`);
  } else if (tsType === 'number') {
    options.push(`type: 'number'`);
  } else if (tsType === 'boolean') {
    options.push(`type: 'boolean'`);
  }

  if (column.enum_values && column.enum_values.length > 0) {
    const enumName = `${column.column_name.charAt(0).toUpperCase()}${column.column_name.slice(1)}Enum`;
    options.push(`enum: ${enumName}`);
  }

  if (!column.is_required) {
    options.push(`required: false`);
  }

  if (column.max_length) {
    options.push(`maxLength: ${column.max_length}`);
  }

  if (column.min_value !== undefined) {
    options.push(`minimum: ${column.min_value}`);
  }

  if (column.max_value !== undefined) {
    options.push(`maximum: ${column.max_value}`);
  }

  if (options.length === 0) {
    return '@ApiProperty()';
  }

  return `@ApiProperty({ ${options.join(', ')} })`;
}

/**
 * Check if column should be excluded from create DTO
 */
export function shouldExcludeFromCreate(column: ColumnMetadata): boolean {
  // Exclude primary keys (auto-generated)
  if (column.is_primary_key) return true;

  // Exclude timestamp columns (auto-managed)
  const autoColumns = ['created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by'];
  if (autoColumns.includes(column.column_name.toLowerCase())) return true;

  // Exclude if not in form
  if (!column.display_in_form) return true;

  return false;
}

/**
 * Check if column should be excluded from update DTO
 */
export function shouldExcludeFromUpdate(column: ColumnMetadata): boolean {
  // Exclude primary keys (immutable)
  if (column.is_primary_key) return true;

  // Exclude created_at and created_by (immutable)
  const immutableColumns = ['created_at', 'created_by'];
  if (immutableColumns.includes(column.column_name.toLowerCase())) return true;

  // Exclude updated_at, updated_by (auto-managed)
  const autoColumns = ['updated_at', 'updated_by', 'deleted_at'];
  if (autoColumns.includes(column.column_name.toLowerCase())) return true;

  // Exclude if not in form
  if (!column.display_in_form) return true;

  return false;
}
