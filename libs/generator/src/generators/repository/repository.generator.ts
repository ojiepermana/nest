/**
 * Repository Generator
 *
 * Generates TypeORM repository classes with custom query methods
 */

import { toPascalCase, toCamelCase } from '../../utils/string.util';
import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';

export interface RepositoryGeneratorOptions {
  tableName: string;
  entityName?: string;
  softDelete?: boolean;
  timestampColumns?: {
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string;
  };
  customMethods?: boolean;
  bulkOperations?: boolean;
  transactionSupport?: boolean;
  auditLogging?: boolean;
  useTypeORM?: boolean; // Add option to use TypeORM or plain SQL
}

export class RepositoryGenerator {
  constructor(
    private tableMetadata: TableMetadata,
    private columns: ColumnMetadata[],
    private options: RepositoryGeneratorOptions,
  ) {}

  /**
   * Generate repository class
   */
  generate(): string {
    // Use plain SQL repository if useTypeORM is false
    if (this.options.useTypeORM === false) {
      return this.generatePlainRepository();
    }

    const entityName = this.options.entityName || toPascalCase(this.options.tableName);
    const repositoryName = `${entityName}Repository`;
    const filterDtoName = `${entityName}FilterDto`;

    const imports = this.generateImports(entityName, filterDtoName);
    const classDeclaration = this.generateClassDeclaration(repositoryName, entityName);
    const constructor = this.generateConstructor();
    const basicMethods = this.generateBasicMethods(entityName);
    const filterMethods = this.generateFilterMethods(entityName, filterDtoName);
    const softDeleteMethods = this.options.softDelete
      ? this.generateSoftDeleteMethods(entityName)
      : '';
    const customMethods = this.options.customMethods ? this.generateCustomMethods(entityName) : '';
    const bulkMethods = this.options.bulkOperations ? this.generateBulkMethods(entityName) : '';
    const transactionMethods = this.options.transactionSupport
      ? this.generateTransactionMethods(entityName)
      : '';

    return `${imports}

${classDeclaration}
${constructor}
${basicMethods}
${filterMethods}
${softDeleteMethods}
${customMethods}
${bulkMethods}
${transactionMethods}
}
`;
  }

  /**
   * Generate imports
   */
  private generateImports(entityName: string, filterDtoName: string): string {
    const imports = [
      "import { Injectable } from '@nestjs/common';",
      "import { InjectRepository } from '@nestjs/typeorm';",
      "import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial } from 'typeorm';",
      `import { ${entityName} } from '../entities/${this.toKebabCase(entityName)}.entity';`,
      `import { ${filterDtoName} } from '../dto/${this.toKebabCase(entityName)}/${this.toKebabCase(entityName)}-filter.dto';`,
      `import { Create${entityName}Dto } from '../dto/${this.toKebabCase(entityName)}/create-${this.toKebabCase(entityName)}.dto';`,
      `import { Update${entityName}Dto } from '../dto/${this.toKebabCase(entityName)}/update-${this.toKebabCase(entityName)}.dto';`,
    ];

    if (this.options.customMethods) {
      imports.push("import { FilterCompiler } from '@ojiepermana/nest-generator';");
      imports.push("import { QueryBuilder } from '@ojiepermana/nest-generator';");
    }

    if (this.options.transactionSupport) {
      imports.push("import { DataSource, QueryRunner } from 'typeorm';");
    }

    if (this.options.auditLogging) {
      imports.push("import { AuditLogService } from '../audit/audit-log.service';");
    }

    return imports.join('\n');
  }

  /**
   * Generate class declaration
   */
  private generateClassDeclaration(repositoryName: string, entityName: string): string {
    return `@Injectable()
export class ${repositoryName} {`;
  }

  /**
   * Generate constructor
   */
  private generateConstructor(): string {
    const entityName = this.options.entityName || toPascalCase(this.options.tableName);
    const params = [
      `@InjectRepository(${entityName})
    private readonly repository: Repository<${entityName}>`,
    ];

    if (this.options.transactionSupport) {
      params.push('private readonly dataSource: DataSource');
    }

    if (this.options.auditLogging) {
      params.push('private readonly auditLogService: AuditLogService');
    }

    return `  constructor(
    ${params.join(',\n    ')},
  ) {}
`;
  }

  /**
   * Generate basic CRUD methods
   */
  private generateBasicMethods(entityName: string): string {
    const camelName = toCamelCase(entityName);
    const pkColumn = this.getPrimaryKeyColumn();
    const pkType = this.getTypeScriptType(pkColumn?.data_type || 'integer');

    const createMethod = this.options.auditLogging
      ? this.generateCreateWithAudit(entityName, camelName, pkColumn)
      : this.generateCreateBasic(entityName, camelName);

    const updateMethod = this.options.auditLogging
      ? this.generateUpdateWithAudit(entityName, camelName, pkType, pkColumn)
      : this.generateUpdateBasic(entityName, camelName, pkType, pkColumn);

    const deleteMethod = this.options.auditLogging
      ? this.generateDeleteWithAudit(entityName, camelName, pkType, pkColumn)
      : this.generateDeleteBasic(entityName, camelName, pkType);

    return `
${createMethod}

  /**
   * Find all ${camelName}s
   */
  async findAll(options?: FindManyOptions<${entityName}>): Promise<${entityName}[]> {
    return this.repository.find(options);
  }

  /**
   * Find one ${camelName} by ID
   */
  async findOne(id: ${pkType}): Promise<${entityName} | null> {
    return this.repository.findOne({ where: { ${pkColumn?.column_name}: id } as FindOptionsWhere<${entityName}> });
  }

  /**
   * Find one ${camelName} by conditions
   */
  async findOneBy(where: FindOptionsWhere<${entityName}>): Promise<${entityName} | null> {
    return this.repository.findOne({ where });
  }

${updateMethod}

${deleteMethod}

  /**
   * Count ${camelName}s
   */
  async count(where?: FindOptionsWhere<${entityName}>): Promise<number> {
    return this.repository.count({ where });
  }

  /**
   * Check if ${camelName} exists
   */
  async exists(where: FindOptionsWhere<${entityName}>): Promise<boolean> {
    const count = await this.repository.count({ where });
    return count > 0;
  }
`;
  }

  /**
   * Generate create method without audit
   */
  private generateCreateBasic(entityName: string, camelName: string): string {
    return `  /**
   * Create a new ${camelName}
   */
  async create(createDto: Create${entityName}Dto): Promise<${entityName}> {
    const ${camelName} = this.repository.create(createDto as DeepPartial<${entityName}>);
    return this.repository.save(${camelName});
  }`;
  }

  /**
   * Generate create method with audit logging
   */
  private generateCreateWithAudit(
    entityName: string,
    camelName: string,
    pkColumn: ColumnMetadata | undefined,
  ): string {
    const pkField = pkColumn?.column_name || 'id';
    return `  /**
   * Create a new ${camelName} (with audit logging)
   */
  async create(createDto: Create${entityName}Dto, userId?: string): Promise<${entityName}> {
    const ${camelName} = this.repository.create(createDto as DeepPartial<${entityName}>);
    const saved = await this.repository.save(${camelName});

    // Log creation
    await this.auditLogService.log({
      action: 'CREATE',
      entity_type: '${this.options.tableName}',
      entity_id: String(saved.${pkField}),
      user_id: userId,
      new_values: saved,
    });

    return saved;
  }`;
  }

  /**
   * Generate update method without audit
   */
  private generateUpdateBasic(
    entityName: string,
    camelName: string,
    pkType: string,
    pkColumn: ColumnMetadata | undefined,
  ): string {
    return `  /**
   * Update a ${camelName}
   */
  async update(id: ${pkType}, updateDto: Update${entityName}Dto): Promise<${entityName}> {
    const ${camelName} = await this.findOne(id);
    if (!${camelName}) {
      throw new Error('${entityName} not found');
    }
    Object.assign(${camelName}, updateDto);
    return this.repository.save(${camelName});
  }`;
  }

  /**
   * Generate update method with audit logging
   */
  private generateUpdateWithAudit(
    entityName: string,
    camelName: string,
    pkType: string,
    pkColumn: ColumnMetadata | undefined,
  ): string {
    const pkField = pkColumn?.column_name || 'id';
    return `  /**
   * Update a ${camelName} (with audit logging)
   */
  async update(id: ${pkType}, updateDto: Update${entityName}Dto, userId?: string): Promise<${entityName}> {
    const ${camelName} = await this.findOne(id);
    if (!${camelName}) {
      throw new Error('${entityName} not found');
    }

    // Capture old values
    const oldValues = { ...${camelName} };

    // Apply updates
    Object.assign(${camelName}, updateDto);
    const updated = await this.repository.save(${camelName});

    // Log update
    await this.auditLogService.log({
      action: 'UPDATE',
      entity_type: '${this.options.tableName}',
      entity_id: String(updated.${pkField}),
      user_id: userId,
      old_values: oldValues,
      new_values: updated,
    });

    return updated;
  }`;
  }

  /**
   * Generate delete method without audit
   */
  private generateDeleteBasic(entityName: string, camelName: string, pkType: string): string {
    return `  /**
   * Delete a ${camelName}
   */
  async remove(id: ${pkType}): Promise<void> {
    await this.repository.delete(id);
  }`;
  }

  /**
   * Generate delete method with audit logging
   */
  private generateDeleteWithAudit(
    entityName: string,
    camelName: string,
    pkType: string,
    pkColumn: ColumnMetadata | undefined,
  ): string {
    const pkField = pkColumn?.column_name || 'id';
    return `  /**
   * Delete a ${camelName} (with audit logging)
   */
  async remove(id: ${pkType}, userId?: string): Promise<void> {
    // Capture entity before deletion
    const ${camelName} = await this.findOne(id);
    if (!${camelName}) {
      throw new Error('${entityName} not found');
    }

    // Delete the entity
    await this.repository.delete(id);

    // Log deletion
    await this.auditLogService.log({
      action: 'DELETE',
      entity_type: '${this.options.tableName}',
      entity_id: String(${camelName}.${pkField}),
      user_id: userId,
      old_values: ${camelName},
    });
  }`;
  }

  /**
   * Generate filter methods
   */
  private generateFilterMethods(entityName: string, filterDtoName: string): string {
    const camelName = toCamelCase(entityName);

    return `
  /**
   * Find ${camelName}s with filters
   */
  async findWithFilters(
    filterDto: ${filterDtoName},
    options?: { page?: number; limit?: number; sort?: Array<{ field: string; order: 'ASC' | 'DESC' }> },
  ): Promise<{ data: ${entityName}[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.repository.createQueryBuilder('${camelName}');

    // Apply filters
    Object.keys(filterDto).forEach((key) => {
      const value = filterDto[key as keyof ${filterDtoName}];
      if (value === undefined || value === null) {
        return;
      }

      // Parse operator suffix
      const operatorMatch = key.match(/^(.+)_(eq|ne|gt|gte|lt|lte|like|in|between|null)$/);
      
      if (operatorMatch) {
        const [, field, operator] = operatorMatch;
        this.applyFilter(queryBuilder, field, operator, value);
      } else {
        // Default to equality
        queryBuilder.andWhere(\`${camelName}.\${key} = :value_\${key}\`, { [\`value_\${key}\`]: value });
      }
    });

    // Apply sorting
    if (options?.sort && options.sort.length > 0) {
      options.sort.forEach((sortOption, index) => {
        if (index === 0) {
          queryBuilder.orderBy(\`${camelName}.\${sortOption.field}\`, sortOption.order);
        } else {
          queryBuilder.addOrderBy(\`${camelName}.\${sortOption.field}\`, sortOption.order);
        }
      });
    }

    // Count total
    const total = await queryBuilder.getCount();

    // Apply pagination
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    queryBuilder.skip((page - 1) * limit).take(limit);

    const data = await queryBuilder.getMany();

    return { data, total, page, limit };
  }

  /**
   * Apply filter to query builder
   */
  private applyFilter(
    queryBuilder: any,
    field: string,
    operator: string,
    value: any,
  ): void {
    const camelName = '${camelName}';
    const paramKey = \`filter_\${field}_\${operator}\`;

    switch (operator) {
      case 'eq':
        queryBuilder.andWhere(\`\${camelName}.\${field} = :\${paramKey}\`, { [paramKey]: value });
        break;
      case 'ne':
        queryBuilder.andWhere(\`\${camelName}.\${field} != :\${paramKey}\`, { [paramKey]: value });
        break;
      case 'gt':
        queryBuilder.andWhere(\`\${camelName}.\${field} > :\${paramKey}\`, { [paramKey]: value });
        break;
      case 'gte':
        queryBuilder.andWhere(\`\${camelName}.\${field} >= :\${paramKey}\`, { [paramKey]: value });
        break;
      case 'lt':
        queryBuilder.andWhere(\`\${camelName}.\${field} < :\${paramKey}\`, { [paramKey]: value });
        break;
      case 'lte':
        queryBuilder.andWhere(\`\${camelName}.\${field} <= :\${paramKey}\`, { [paramKey]: value });
        break;
      case 'like':
        queryBuilder.andWhere(\`\${camelName}.\${field} LIKE :\${paramKey}\`, { [paramKey]: \`%\${value}%\` });
        break;
      case 'in':
        if (Array.isArray(value) && value.length > 0) {
          queryBuilder.andWhere(\`\${camelName}.\${field} IN (:\${paramKey})\`, { [paramKey]: value });
        }
        break;
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          queryBuilder.andWhere(\`\${camelName}.\${field} BETWEEN :\${paramKey}_start AND :\${paramKey}_end\`, {
            [\`\${paramKey}_start\`]: value[0],
            [\`\${paramKey}_end\`]: value[1],
          });
        }
        break;
      case 'null':
        if (value === true) {
          queryBuilder.andWhere(\`\${camelName}.\${field} IS NULL\`);
        } else if (value === false) {
          queryBuilder.andWhere(\`\${camelName}.\${field} IS NOT NULL\`);
        }
        break;
    }
  }
`;
  }

  /**
   * Generate soft delete methods
   */
  private generateSoftDeleteMethods(entityName: string): string {
    const camelName = toCamelCase(entityName);
    const pkColumn = this.getPrimaryKeyColumn();
    const pkType = this.getTypeScriptType(pkColumn?.data_type || 'integer');
    const deletedAtColumn = this.options.timestampColumns?.deletedAt || 'deleted_at';

    return `
  /**
   * Soft delete a ${camelName}
   */
  async softDelete(id: ${pkType}): Promise<void> {
    await this.repository.update(id, { ${deletedAtColumn}: new Date() } as any);
  }

  /**
   * Restore a soft-deleted ${camelName}
   */
  async restore(id: ${pkType}): Promise<void> {
    await this.repository.update(id, { ${deletedAtColumn}: null } as any);
  }

  /**
   * Find with soft-deleted records
   */
  async findAllWithDeleted(options?: FindManyOptions<${entityName}>): Promise<${entityName}[]> {
    return this.repository.find({ ...options, withDeleted: true });
  }

  /**
   * Find only soft-deleted records
   */
  async findOnlyDeleted(): Promise<${entityName}[]> {
    const queryBuilder = this.repository.createQueryBuilder('${camelName}');
    queryBuilder.where('${camelName}.${deletedAtColumn} IS NOT NULL');
    queryBuilder.withDeleted();
    return queryBuilder.getMany();
  }
`;
  }

  /**
   * Generate custom methods
   */
  private generateCustomMethods(entityName: string): string {
    const camelName = toCamelCase(entityName);

    return `
  /**
   * Find by IDs
   */
  async findByIds(ids: number[]): Promise<${entityName}[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.repository.findByIds(ids);
  }

  /**
   * Find one or fail
   */
  async findOneOrFail(id: number): Promise<${entityName}> {
    const ${camelName} = await this.findOne(id);
    if (!${camelName}) {
      throw new Error('${entityName} not found');
    }
    return ${camelName};
  }

  /**
   * Increment a field
   */
  async increment(id: number, field: keyof ${entityName}, value: number): Promise<void> {
    await this.repository.increment({ id } as any, field as string, value);
  }

  /**
   * Decrement a field
   */
  async decrement(id: number, field: keyof ${entityName}, value: number): Promise<void> {
    await this.repository.decrement({ id } as any, field as string, value);
  }
`;
  }

  /**
   * Generate bulk operation methods
   */
  private generateBulkMethods(entityName: string): string {
    const camelName = toCamelCase(entityName);

    return `
  /**
   * Bulk create
   */
  async bulkCreate(createDtos: Create${entityName}Dto[]): Promise<${entityName}[]> {
    const entities = this.repository.create(createDtos as DeepPartial<${entityName}>[]);
    return this.repository.save(entities);
  }

  /**
   * Bulk update
   */
  async bulkUpdate(ids: number[], updateDto: Update${entityName}Dto): Promise<void> {
    await this.repository.update(ids, updateDto as any);
  }

  /**
   * Bulk delete
   */
  async bulkDelete(ids: number[]): Promise<void> {
    await this.repository.delete(ids);
  }

  /**
   * Upsert (insert or update)
   */
  async upsert(data: Create${entityName}Dto, conflictFields: (keyof ${entityName})[]): Promise<${entityName}> {
    const result = await this.repository.upsert(data as DeepPartial<${entityName}>, conflictFields as string[]);
    return result.identifiers[0] as ${entityName};
  }
`;
  }

  /**
   * Generate transaction methods
   */
  private generateTransactionMethods(entityName: string): string {
    const camelName = toCamelCase(entityName);

    return `
  /**
   * Execute in transaction
   */
  async transaction<T>(callback: (queryRunner: QueryRunner) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get repository for transaction
   */
  getRepositoryForTransaction(queryRunner: QueryRunner): Repository<${entityName}> {
    return queryRunner.manager.getRepository(${entityName});
  }
`;
  }

  /**
   * Get primary key column
   */
  private getPrimaryKeyColumn(): ColumnMetadata | undefined {
    return this.columns.find((col) => col.is_primary_key);
  }

  /**
   * Get TypeScript type from database type
   */
  private getTypeScriptType(dbType: string): string {
    const lowerType = dbType.toLowerCase();

    if (lowerType.includes('int') || lowerType.includes('serial') || lowerType.includes('number')) {
      return 'number';
    }

    if (
      lowerType.includes('varchar') ||
      lowerType.includes('text') ||
      lowerType.includes('char') ||
      lowerType.includes('uuid')
    ) {
      return 'string';
    }

    if (lowerType.includes('bool')) {
      return 'boolean';
    }

    if (lowerType.includes('date') || lowerType.includes('time')) {
      return 'Date';
    }

    if (lowerType.includes('json')) {
      return 'any';
    }

    return 'any';
  }

  /**
   * Convert to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Generate README with audit logging examples
   */
  generateReadme(): string {
    if (!this.options.auditLogging) {
      return '';
    }

    const entityName = this.options.entityName || toPascalCase(this.options.tableName);
    const repositoryName = `${entityName}Repository`;
    const camelName = toCamelCase(entityName);

    return `# ${repositoryName} - Audit Logging Guide

This repository has audit logging enabled. All CREATE, UPDATE, and DELETE operations are automatically logged.

## Basic Usage

### Create with Audit

\`\`\`typescript
// Pass userId as second parameter
const ${camelName} = await ${camelName}Repository.create(createDto, 'user-123');

// Audit log created:
// {
//   action: 'CREATE',
//   entity_type: '${this.options.tableName}',
//   entity_id: '${camelName}.id',
//   user_id: 'user-123',
//   new_values: ${camelName}
// }
\`\`\`

### Update with Audit

\`\`\`typescript
// Pass userId as third parameter
const updated = await ${camelName}Repository.update(id, updateDto, 'user-123');

// Audit log created with change tracking:
// {
//   action: 'UPDATE',
//   entity_type: '${this.options.tableName}',
//   entity_id: id,
//   user_id: 'user-123',
//   old_values: { name: 'John', email: 'john@old.com' },
//   new_values: { name: 'Jane', email: 'jane@new.com' },
//   changes: [
//     { field: 'name', old_value: 'John', new_value: 'Jane' },
//     { field: 'email', old_value: 'john@old.com', new_value: 'jane@new.com' }
//   ]
// }
\`\`\`

### Delete with Audit

\`\`\`typescript
// Pass userId as second parameter
await ${camelName}Repository.remove(id, 'user-123');

// Audit log created:
// {
//   action: 'DELETE',
//   entity_type: '${this.options.tableName}',
//   entity_id: id,
//   user_id: 'user-123',
//   old_values: ${camelName} // Entity state before deletion
// }
\`\`\`

## Using with Controllers

### Extract userId from Request

\`\`\`typescript
import { Controller, Post, Put, Delete, Body, Param, Request } from '@nestjs/common';

@Controller('${this.options.tableName}')
export class ${entityName}Controller {
  constructor(private readonly ${camelName}Repository: ${repositoryName}) {}

  @Post()
  async create(@Body() createDto: Create${entityName}Dto, @Request() req) {
    const userId = req.user?.id; // Extract from authenticated user
    return this.${camelName}Repository.create(createDto, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: Update${entityName}Dto,
    @Request() req,
  ) {
    const userId = req.user?.id;
    return this.${camelName}Repository.update(id, updateDto, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id;
    return this.${camelName}Repository.remove(id, userId);
  }
}
\`\`\`

## Alternative: Using @AuditLog Decorator

For automatic audit logging without passing userId manually:

\`\`\`typescript
import { Injectable } from '@nestjs/common';
import { AuditLog } from '../audit/audit-log.decorator';

@Injectable()
export class ${entityName}Service {
  constructor(private readonly ${camelName}Repository: ${repositoryName}) {}

  @AuditLog({
    action: 'CREATE',
    entityType: '${this.options.tableName}',
    entityIdParam: 'return', // Extract ID from return value
    newValuesParam: 'return',
  })
  async create(createDto: Create${entityName}Dto) {
    // Don't pass userId - decorator handles it
    return this.${camelName}Repository.create(createDto);
  }

  @AuditLog({
    action: 'UPDATE',
    entityType: '${this.options.tableName}',
    entityIdParam: 'id',
    oldValuesParam: async (params) => this.${camelName}Repository.findOne(params[0]),
    newValuesParam: 'return',
  })
  async update(id: string, updateDto: Update${entityName}Dto) {
    return this.${camelName}Repository.update(id, updateDto);
  }

  @AuditLog({
    action: 'DELETE',
    entityType: '${this.options.tableName}',
    entityIdParam: 0,
    oldValuesParam: async (params) => this.${camelName}Repository.findOne(params[0]),
  })
  async remove(id: string) {
    return this.${camelName}Repository.remove(id);
  }
}
\`\`\`

## Query Audit Logs

### Get Entity History

\`\`\`typescript
import { AuditLogService } from '../audit/audit-log.service';

const history = await auditLogService.getEntityHistory('${this.options.tableName}', entityId);
\`\`\`

### Get User Activity

\`\`\`typescript
const activity = await auditLogService.getUserActivity(userId, startDate, endDate);
\`\`\`

### Rollback Changes

\`\`\`typescript
const lastUpdate = history.find(log => log.action === 'UPDATE');
await auditLogService.rollback({
  audit_log_id: lastUpdate.id,
  rolled_back_by: 'admin-user-id',
  reason: 'Accidental change',
});
\`\`\`

## Configuration

Audit logging can be configured in \`audit.config.ts\`:

\`\`\`typescript
export const auditConfig = {
  enabled: true,
  log_reads: false,
  excluded_fields: ['password', 'token', 'secret'],
  retention_days: 90,
};
\`\`\`

## See Also

- Full audit documentation: \`audit/AUDIT_DOCUMENTATION.md\`
- Audit service API: \`audit/audit-log.service.ts\`
- Decorator usage: \`audit/audit-log.decorator.ts\`
`;
  }

  /**
   * Generate plain SQL repository (no TypeORM)
   */
  private generatePlainRepository(): string {
    const entityName = this.options.entityName || toPascalCase(this.options.tableName);
    const repositoryName = `${entityName}Repository`;
    const schemaName = this.tableMetadata.schema_name || 'public';
    const tableName = this.options.tableName;
    const pkColumn = this.getPrimaryKeyColumn();
    const pkName = pkColumn?.column_name || 'id';
    const pkType = this.getTypeScriptType(pkColumn?.data_type || 'integer');

    // Detect foreign keys
    const fkColumns = this.columns.filter(
      (col) => col.ref_schema && col.ref_table && col.ref_column,
    );
    const hasRelations = fkColumns.length > 0;

    // Generate JOIN query methods if there are foreign keys
    const joinMethods = hasRelations
      ? this.generateJoinMethods(entityName, schemaName, tableName, pkName, pkType, fkColumns)
      : '';

    return `import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { Create${entityName}Dto } from '../dto/${this.toKebabCase(entityName)}/create-${this.toKebabCase(entityName)}.dto';
import { Update${entityName}Dto } from '../dto/${this.toKebabCase(entityName)}/update-${this.toKebabCase(entityName)}.dto';
import { ${entityName}FilterDto } from '../dto/${this.toKebabCase(entityName)}/${this.toKebabCase(entityName)}-filter.dto';

@Injectable()
export class ${repositoryName} {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  /**
   * Create a new ${toCamelCase(entityName)}
   */
  async create(dto: Create${entityName}Dto): Promise<any> {
    const columns = Object.keys(dto);
    const values = Object.values(dto);
    const placeholders = values.map((_, i) => \`$\${i + 1}\`).join(', ');
    
    const query = \`
      INSERT INTO "${schemaName}"."${tableName}" (\${columns.join(', ')})
      VALUES (\${placeholders})
      RETURNING *
    \`;
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find all ${toCamelCase(entityName)}s
   */
  async findAll(): Promise<any[]> {
    const query = \`SELECT * FROM "${schemaName}"."${tableName}" ORDER BY ${pkName}\`;
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Find one ${toCamelCase(entityName)} by ID
   */
  async findOne(id: ${pkType}): Promise<any | null> {
    const query = \`SELECT * FROM "${schemaName}"."${tableName}" WHERE ${pkName} = $1\`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find ${toCamelCase(entityName)}s with filters
   */
  async findWithFilters(
    filter: ${entityName}FilterDto,
    options?: { page?: number; limit?: number; sort?: Array<{ field: string; order: 'ASC' | 'DESC' }> },
  ): Promise<{ data: any[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions from filter (skip pagination fields)
    const paginationFields = ['page', 'limit', 'sort'];
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && !paginationFields.includes(key)) {
        conditions.push(\`\${key} = $\${paramIndex}\`);
        values.push(value);
        paramIndex++;
      }
    });

    const whereClause = conditions.length > 0 ? \`WHERE \${conditions.join(' AND ')}\` : '';
    
    // Get total count
    const countQuery = \`SELECT COUNT(*) as total FROM "${schemaName}"."${tableName}" \${whereClause}\`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    // Build ORDER BY clause
    let orderByClause = \`ORDER BY ${pkName}\`;
    if (options?.sort && options.sort.length > 0) {
      const sortClauses = options.sort.map(s => \`\${s.field} \${s.order}\`).join(', ');
      orderByClause = \`ORDER BY \${sortClauses}\`;
    }

    // Build pagination
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    // Get paginated data
    const dataQuery = \`SELECT * FROM "${schemaName}"."${tableName}" \${whereClause} \${orderByClause} LIMIT $\${paramIndex} OFFSET $\${paramIndex + 1}\`;
    const dataValues = [...values, limit, offset];
    const dataResult = await this.pool.query(dataQuery, dataValues);

    return {
      data: dataResult.rows,
      total,
    };
  }

  /**
   * Update ${toCamelCase(entityName)}
   */
  async update(id: ${pkType}, dto: Update${entityName}Dto): Promise<any | null> {
    const entries = Object.entries(dto).filter(([_, value]) => value !== undefined);
    if (entries.length === 0) return this.findOne(id);

    const setClauses = entries.map(([key], i) => \`\${key} = $\${i + 1}\`).join(', ');
    const values = [...entries.map(([_, value]) => value), id];
    
    const query = \`
      UPDATE "${schemaName}"."${tableName}"
      SET \${setClauses}
      WHERE ${pkName} = $\${values.length}
      RETURNING *
    \`;
    
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete ${toCamelCase(entityName)}
   */
  async delete(id: ${pkType}): Promise<boolean> {
    const query = \`DELETE FROM "${schemaName}"."${tableName}" WHERE ${pkName} = $1\`;
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Count ${toCamelCase(entityName)}s
   */
  async count(): Promise<number> {
    const query = \`SELECT COUNT(*) as count FROM "${schemaName}"."${tableName}"\`;
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if ${toCamelCase(entityName)} exists
   */
  async exists(id: ${pkType}): Promise<boolean> {
    const query = \`SELECT 1 FROM "${schemaName}"."${tableName}" WHERE ${pkName} = $1 LIMIT 1\`;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }
${joinMethods}
}
`;
  }

  /**
   * Generate JOIN methods for repositories with foreign keys
   */
  private generateJoinMethods(
    entityName: string,
    schemaName: string,
    tableName: string,
    pkName: string,
    pkType: string,
    fkColumns: ColumnMetadata[],
  ): string {
    const camelName = toCamelCase(entityName);

    // Build JOIN clauses
    const joinClauses: string[] = [];
    const selectColumns: string[] = [`t.*`];

    fkColumns.forEach((col, index) => {
      const joinAlias = `rel_${index}`;
      const refSchema = col.ref_schema || 'public';
      const refTable = col.ref_table || '';
      const refColumn = col.ref_column || 'id';
      const joinType = col.is_nullable ? 'LEFT' : 'INNER';

      // Generate JOIN clause
      joinClauses.push(
        `${joinType} JOIN "${refSchema}"."${refTable}" AS ${joinAlias} ON t.${col.column_name} = ${joinAlias}.${refColumn}`,
      );

      // Add select columns from joined table (name, title, code as common display fields)
      selectColumns.push(
        `${joinAlias}.id AS ${col.column_name}_id`,
        `${joinAlias}.name AS ${col.column_name}_name`,
      );
    });

    const joinClause = joinClauses.join('\n      ');
    const selectClause = selectColumns.join(',\n        ');

    return `
  /**
   * Find one ${camelName} by ID with relations
   * Includes data from related tables via JOIN
   */
  async findOneWithRelations(id: ${pkType}): Promise<any | null> {
    const query = \`
      SELECT
        ${selectClause}
      FROM "${schemaName}"."${tableName}" AS t
      ${joinClause}
      WHERE t.${pkName} = $1
      AND t.deleted_at IS NULL
    \`;
    
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find all ${camelName}s with relations
   * Includes data from related tables via JOIN with pagination
   */
  async findAllWithRelations(
    filters?: any,
    options?: { page?: number; limit?: number; sort?: Array<{ field: string; order: 'ASC' | 'DESC' }> },
  ): Promise<{ data: any[]; total: number }> {
    // Build WHERE conditions
    const conditions: string[] = ['t.deleted_at IS NULL'];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters) {
      const paginationFields = ['page', 'limit', 'sort'];
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && !paginationFields.includes(key)) {
          conditions.push(\`t.\${key} = $\${paramIndex}\`);
          values.push(value);
          paramIndex++;
        }
      });
    }

    const whereClause = \`WHERE \${conditions.join(' AND ')}\`;

    // Get total count
    const countQuery = \`
      SELECT COUNT(*) as total
      FROM "${schemaName}"."${tableName}" AS t
      \${whereClause}
    \`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    // Build ORDER BY clause
    let orderByClause = \`ORDER BY t.${pkName}\`;
    if (options?.sort && options.sort.length > 0) {
      const sortClauses = options.sort.map(s => \`t.\${s.field} \${s.order}\`).join(', ');
      orderByClause = \`ORDER BY \${sortClauses}\`;
    }

    // Build pagination
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const offset = (page - 1) * limit;

    // Get paginated data with JOINs
    const dataQuery = \`
      SELECT
        ${selectClause}
      FROM "${schemaName}"."${tableName}" AS t
      ${joinClause}
      \${whereClause}
      \${orderByClause}
      LIMIT $\${paramIndex}
      OFFSET $\${paramIndex + 1}
    \`;
    
    const dataValues = [...values, limit, offset];
    const dataResult = await this.pool.query(dataQuery, dataValues);

    return {
      data: dataResult.rows,
      total,
    };
  }
`;
  }
}
