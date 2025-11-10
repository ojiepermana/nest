/**
 * Entity Generator
 *
 * Generates TypeORM entities from database metadata
 */

import { toPascalCase, toCamelCase } from '../../utils/string.util';
import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';

export interface EntityGeneratorOptions {
  tableName: string;
  entityName?: string;
  schema?: string;
  enableTimestamps?: boolean;
  enableSoftDelete?: boolean;
  customDecorators?: Record<string, string[]>;
}

export class EntityGenerator {
  constructor(
    private tableMetadata: TableMetadata,
    private columns: ColumnMetadata[],
    private options: EntityGeneratorOptions,
  ) {}

  /**
   * Generate entity class
   */
  generate(): string {
    const entityName = this.options.entityName || toPascalCase(this.options.tableName);

    const imports = this.generateImports();
    const classDeclaration = this.generateClassDeclaration(entityName);
    const properties = this.generateProperties();

    return `${imports}

${classDeclaration}
${properties}}
`;
  }

  /**
   * Generate imports
   */
  private generateImports(): string {
    const imports = new Set<string>();

    // Base TypeORM imports
    imports.add('Entity');
    imports.add('Column');

    // Check if we need PrimaryGeneratedColumn or PrimaryColumn
    const pkColumn = this.columns.find((col) => col.is_primary_key);
    if (pkColumn) {
      if (this.isAutoIncrement(pkColumn)) {
        imports.add('PrimaryGeneratedColumn');
      } else {
        imports.add('PrimaryColumn');
      }
    }

    // Check for timestamps
    if (this.hasTimestampColumns()) {
      imports.add('CreateDateColumn');
      imports.add('UpdateDateColumn');
    }

    // Check for soft delete
    if (this.options.enableSoftDelete || this.hasSoftDeleteColumn()) {
      imports.add('DeleteDateColumn');
    }

    // Check for unique constraints
    if (this.hasUniqueColumns()) {
      imports.add('Index');
    }

    const importArray = Array.from(imports).sort();
    return `import { ${importArray.join(', ')} } from 'typeorm';`;
  }

  /**
   * Generate class declaration with @Entity decorator
   */
  private generateClassDeclaration(entityName: string): string {
    const decorators: string[] = [];

    // @Entity decorator with table name
    const entityOptions: string[] = [];

    if (this.options.schema && this.options.schema !== 'public') {
      entityOptions.push(`schema: '${this.options.schema}'`);
    }

    const entityDecorator =
      entityOptions.length > 0
        ? `@Entity('${this.options.tableName}', { ${entityOptions.join(', ')} })`
        : `@Entity('${this.options.tableName}')`;

    decorators.push(entityDecorator);

    // Add unique constraints as @Index decorators
    const uniqueIndexes = this.generateUniqueIndexes();
    if (uniqueIndexes.length > 0) {
      decorators.push(...uniqueIndexes);
    }

    return `${decorators.join('\n')}
export class ${entityName} {`;
  }

  /**
   * Generate unique indexes
   */
  private generateUniqueIndexes(): string[] {
    const indexes: string[] = [];
    const uniqueColumns = this.columns.filter((col) => col.is_unique && !col.is_primary_key);

    for (const col of uniqueColumns) {
      indexes.push(`@Index('${col.column_name}_unique', ['${col.column_name}'], { unique: true })`);
    }

    return indexes;
  }

  /**
   * Generate entity properties
   */
  private generateProperties(): string {
    const properties: string[] = [];

    for (const column of this.columns) {
      const property = this.generateProperty(column);
      if (property) {
        properties.push(property);
      }
    }

    return properties.join('\n\n');
  }

  /**
   * Generate single property with decorators
   */
  private generateProperty(column: ColumnMetadata): string {
    // Skip if it's a timestamp column and we're using TypeORM decorators
    if (this.isTimestampColumn(column)) {
      return this.generateTimestampProperty(column);
    }

    // Skip if it's soft delete column
    if (this.isSoftDeleteColumn(column)) {
      return this.generateSoftDeleteProperty(column);
    }

    const decorators: string[] = [];
    const propertyName = this.toCamelCase(column.column_name);
    const tsType = this.getTypeScriptType(column.data_type);
    const nullable = column.is_nullable ? '?' : '';

    // Primary key decorator
    if (column.is_primary_key) {
      if (this.isAutoIncrement(column)) {
        decorators.push(this.generatePrimaryGeneratedColumnDecorator(column));
      } else {
        decorators.push(this.generatePrimaryColumnDecorator(column));
      }
    } else {
      // Regular column decorator
      decorators.push(this.generateColumnDecorator(column));
    }

    // Custom decorators
    if (this.options.customDecorators?.[column.column_name]) {
      decorators.push(...this.options.customDecorators[column.column_name]);
    }

    return `  ${decorators.join('\n  ')}
  ${propertyName}${nullable}: ${tsType};`;
  }

  /**
   * Generate @PrimaryGeneratedColumn decorator
   */
  private generatePrimaryGeneratedColumnDecorator(column: ColumnMetadata): string {
    // UUID strategy
    if (column.data_type === 'uuid') {
      return "@PrimaryGeneratedColumn('uuid')";
    }

    // Default auto-increment (identity, increment)
    return '@PrimaryGeneratedColumn()';
  }

  /**
   * Generate @PrimaryColumn decorator
   */
  private generatePrimaryColumnDecorator(column: ColumnMetadata): string {
    const options: string[] = [];

    if (column.column_name !== this.toCamelCase(column.column_name)) {
      options.push(`name: '${column.column_name}'`);
    }

    const typeOption = this.getColumnTypeOption(column);
    if (typeOption) {
      options.push(`type: '${typeOption}'`);
    }

    if (options.length > 0) {
      return `@PrimaryColumn({ ${options.join(', ')} })`;
    }
    return '@PrimaryColumn()';
  }

  /**
   * Generate @Column decorator
   */
  private generateColumnDecorator(column: ColumnMetadata): string {
    const options: string[] = [];

    // Column name if different from property name
    if (column.column_name !== this.toCamelCase(column.column_name)) {
      options.push(`name: '${column.column_name}'`);
    }

    // Type
    const typeOption = this.getColumnTypeOption(column);
    if (typeOption) {
      options.push(`type: '${typeOption}'`);
    }

    // Length for varchar/char (from max_length)
    if (
      column.max_length &&
      (column.data_type === 'varchar' || column.data_type === 'character varying')
    ) {
      options.push(`length: ${column.max_length}`);
    }

    // Nullable
    if (column.is_nullable) {
      options.push('nullable: true');
    }

    // Unique
    if (column.is_unique && !column.is_primary_key) {
      options.push('unique: true');
    }

    // Default value
    if (column.default_value) {
      const defaultValue = this.formatDefaultValue(column.default_value, column.data_type);
      if (defaultValue) {
        options.push(`default: ${defaultValue}`);
      }
    }

    if (options.length > 0) {
      return `@Column({ ${options.join(', ')} })`;
    }
    return '@Column()';
  }

  /**
   * Generate timestamp property
   */
  private generateTimestampProperty(column: ColumnMetadata): string {
    const propertyName = this.toCamelCase(column.column_name);

    if (column.column_name === 'created_at' || column.column_name === 'createdAt') {
      return `  @CreateDateColumn({ name: '${column.column_name}' })
  ${propertyName}: Date;`;
    }

    if (column.column_name === 'updated_at' || column.column_name === 'updatedAt') {
      return `  @UpdateDateColumn({ name: '${column.column_name}' })
  ${propertyName}: Date;`;
    }

    return this.generateProperty(column);
  }

  /**
   * Generate soft delete property
   */
  private generateSoftDeleteProperty(column: ColumnMetadata): string {
    const propertyName = this.toCamelCase(column.column_name);
    return `  @DeleteDateColumn({ name: '${column.column_name}' })
  ${propertyName}?: Date;`;
  }

  /**
   * Check if column is auto-increment
   */
  private isAutoIncrement(column: ColumnMetadata): boolean {
    // Check default value for sequences or auto increment
    if (!column.default_value) return false;

    return (
      column.default_value.includes('nextval') ||
      column.default_value.includes('AUTO_INCREMENT') ||
      column.default_value.includes('autoincrement') ||
      column.default_value.includes('uuid_generate')
    );
  }

  /**
   * Get generation strategy for primary key
   */
  private getGenerationStrategy(column: ColumnMetadata): string {
    if (column.data_type === 'uuid') {
      return 'uuid';
    }
    if (this.isAutoIncrement(column)) {
      return 'increment';
    }
    return 'increment';
  }

  /**
   * Get column type option for TypeORM
   */
  private getColumnTypeOption(column: ColumnMetadata): string | null {
    const typeMap: Record<string, string> = {
      'character varying': 'varchar',
      bigint: 'bigint',
      smallint: 'smallint',
      'double precision': 'double precision',
      timestamp: 'timestamp',
      'timestamp without time zone': 'timestamp',
      'timestamp with time zone': 'timestamptz',
      uuid: 'uuid',
      jsonb: 'jsonb',
      json: 'json',
    };

    return typeMap[column.data_type] || null;
  }

  /**
   * Format default value for TypeORM
   */
  private formatDefaultValue(defaultValue: string, dataType: string): string | null {
    // Skip database functions
    if (
      defaultValue.includes('nextval') ||
      defaultValue.includes('now()') ||
      defaultValue.includes('CURRENT_TIMESTAMP') ||
      defaultValue.includes('uuid_generate')
    ) {
      return null;
    }

    // Boolean values
    if (dataType === 'boolean') {
      if (defaultValue.includes('true')) return 'true';
      if (defaultValue.includes('false')) return 'false';
    }

    // Numeric values
    if (['integer', 'bigint', 'smallint', 'decimal', 'numeric'].includes(dataType)) {
      const numMatch = defaultValue.match(/(-?\d+\.?\d*)/);
      if (numMatch) return numMatch[1];
    }

    // String values
    const strMatch = defaultValue.match(/'([^']*)'/);
    if (strMatch) {
      return `'${strMatch[1]}'`;
    }

    return null;
  }

  /**
   * Get TypeScript type from database type
   */
  private getTypeScriptType(dataType: string): string {
    const typeMap: Record<string, string> = {
      integer: 'number',
      bigint: 'number',
      smallint: 'number',
      decimal: 'number',
      numeric: 'number',
      'double precision': 'number',
      real: 'number',
      varchar: 'string',
      'character varying': 'string',
      char: 'string',
      text: 'string',
      uuid: 'string',
      boolean: 'boolean',
      timestamp: 'Date',
      'timestamp without time zone': 'Date',
      'timestamp with time zone': 'Date',
      date: 'Date',
      time: 'Date',
      json: 'any',
      jsonb: 'any',
    };

    return typeMap[dataType] || 'string';
  }

  /**
   * Check if table has timestamp columns
   */
  private hasTimestampColumns(): boolean {
    return this.columns.some((col) => this.isTimestampColumn(col));
  }

  /**
   * Check if column is a timestamp column
   */
  private isTimestampColumn(column: ColumnMetadata): boolean {
    const timestampNames = ['created_at', 'updated_at', 'createdAt', 'updatedAt'];
    return timestampNames.includes(column.column_name);
  }

  /**
   * Check if table has soft delete column
   */
  private hasSoftDeleteColumn(): boolean {
    return this.columns.some((col) => this.isSoftDeleteColumn(col));
  }

  /**
   * Check if column is soft delete column
   */
  private isSoftDeleteColumn(column: ColumnMetadata): boolean {
    const softDeleteNames = ['deleted_at', 'deletedAt'];
    return softDeleteNames.includes(column.column_name);
  }

  /**
   * Check if table has unique columns
   */
  private hasUniqueColumns(): boolean {
    return this.columns.some((col) => col.is_unique && !col.is_primary_key);
  }

  /**
   * Convert string to camelCase
   */
  private toCamelCase(str: string): string {
    return toCamelCase(str);
  }
}
