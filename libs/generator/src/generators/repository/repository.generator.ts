/**
 * Repository Generator
 *
 * Generates TypeORM repository classes with custom query methods
 */

import { toPascalCase, toCamelCase } from '../../utils/string.util';
import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';

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
    const entityName =
      this.options.entityName || toPascalCase(this.options.tableName);
    const repositoryName = `${entityName}Repository`;
    const filterDtoName = `${entityName}FilterDto`;

    const imports = this.generateImports(entityName, filterDtoName);
    const classDeclaration = this.generateClassDeclaration(
      repositoryName,
      entityName,
    );
    const constructor = this.generateConstructor();
    const basicMethods = this.generateBasicMethods(entityName);
    const filterMethods = this.generateFilterMethods(entityName, filterDtoName);
    const softDeleteMethods = this.options.softDelete
      ? this.generateSoftDeleteMethods(entityName)
      : '';
    const customMethods = this.options.customMethods
      ? this.generateCustomMethods(entityName)
      : '';
    const bulkMethods = this.options.bulkOperations
      ? this.generateBulkMethods(entityName)
      : '';
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
      `import { ${filterDtoName} } from '../dto/${this.toKebabCase(entityName)}-filter.dto';`,
      `import { Create${entityName}Dto } from '../dto/create-${this.toKebabCase(entityName)}.dto';`,
      `import { Update${entityName}Dto } from '../dto/update-${this.toKebabCase(entityName)}.dto';`,
    ];

    if (this.options.customMethods) {
      imports.push(
        "import { FilterCompiler } from '@ojiepermana/nest-generator';",
      );
      imports.push(
        "import { QueryBuilder } from '@ojiepermana/nest-generator';",
      );
    }

    if (this.options.transactionSupport) {
      imports.push("import { DataSource, QueryRunner } from 'typeorm';");
    }

    return imports.join('\n');
  }

  /**
   * Generate class declaration
   */
  private generateClassDeclaration(
    repositoryName: string,
    entityName: string,
  ): string {
    return `@Injectable()
export class ${repositoryName} {`;
  }

  /**
   * Generate constructor
   */
  private generateConstructor(): string {
    const entityName =
      this.options.entityName || toPascalCase(this.options.tableName);
    const params = [
      `@InjectRepository(${entityName})
    private readonly repository: Repository<${entityName}>`,
    ];

    if (this.options.transactionSupport) {
      params.push('private readonly dataSource: DataSource');
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

    return `
  /**
   * Create a new ${camelName}
   */
  async create(createDto: Create${entityName}Dto): Promise<${entityName}> {
    const ${camelName} = this.repository.create(createDto as DeepPartial<${entityName}>);
    return this.repository.save(${camelName});
  }

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

  /**
   * Update a ${camelName}
   */
  async update(id: ${pkType}, updateDto: Update${entityName}Dto): Promise<${entityName}> {
    const ${camelName} = await this.findOne(id);
    if (!${camelName}) {
      throw new Error('${entityName} not found');
    }
    Object.assign(${camelName}, updateDto);
    return this.repository.save(${camelName});
  }

  /**
   * Delete a ${camelName}
   */
  async remove(id: ${pkType}): Promise<void> {
    await this.repository.delete(id);
  }

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
   * Generate filter methods
   */
  private generateFilterMethods(
    entityName: string,
    filterDtoName: string,
  ): string {
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
    const deletedAtColumn =
      this.options.timestampColumns?.deletedAt || 'deleted_at';

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

    if (
      lowerType.includes('int') ||
      lowerType.includes('serial') ||
      lowerType.includes('number')
    ) {
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
}
