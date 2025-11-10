/**
 * Service Generator
 *
 * Generates NestJS service classes with business logic layer
 */

import { toPascalCase, toCamelCase } from '../../utils/string.util';
import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';

export interface ServiceGeneratorOptions {
  tableName: string;
  entityName?: string;
  enableCaching?: boolean;
  enableErrorHandling?: boolean;
  enableTransactions?: boolean;
  enableValidation?: boolean;
  enableAuditLog?: boolean;
  customMethods?: string[];
}

export class ServiceGenerator {
  constructor(
    private tableMetadata: TableMetadata,
    private columns: ColumnMetadata[],
    private options: ServiceGeneratorOptions,
  ) {}

  /**
   * Generate service class
   */
  generate(): string {
    const entityName =
      this.options.entityName || toPascalCase(this.options.tableName);
    const serviceName = `${entityName}Service`;
    const repositoryName = `${entityName}Repository`;
    const filterDtoName = `${entityName}FilterDto`;

    const imports = this.generateImports(
      entityName,
      repositoryName,
      filterDtoName,
    );
    const classDeclaration = this.generateClassDeclaration(serviceName);
    const constructor = this.generateConstructor(repositoryName);
    const crudMethods = this.generateCRUDMethods(entityName, repositoryName);
    const filterMethods = this.generateFilterMethods(
      entityName,
      filterDtoName,
      repositoryName,
    );
    const customMethods = this.generateCustomMethods(
      entityName,
      repositoryName,
    );

    return `${imports}

${classDeclaration}
${constructor}
${crudMethods}
${filterMethods}
${customMethods}
}
`;
  }

  /**
   * Generate imports
   */
  private generateImports(
    entityName: string,
    repositoryName: string,
    filterDtoName: string,
  ): string {
    const imports = [
      "import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';",
      `import { ${repositoryName} } from '../repositories/${this.toKebabCase(entityName)}.repository';`,
      `import { ${entityName} } from '../entities/${this.toKebabCase(entityName)}.entity';`,
      `import { Create${entityName}Dto } from '../dto/create-${this.toKebabCase(entityName)}.dto';`,
      `import { Update${entityName}Dto } from '../dto/update-${this.toKebabCase(entityName)}.dto';`,
      `import { ${filterDtoName} } from '../dto/${this.toKebabCase(entityName)}-filter.dto';`,
    ];

    if (this.options.enableCaching) {
      imports.push(
        "import { CACHE_MANAGER } from '@nestjs/cache-manager';",
        "import { Inject } from '@nestjs/common';",
        "import { Cache } from 'cache-manager';",
      );
    }

    if (this.options.enableTransactions) {
      imports.push("import { DataSource } from 'typeorm';");
    }

    if (this.options.enableAuditLog) {
      imports.push(
        "import { AuditLogService } from '@ojiepermana/nest-generator/audit';",
      );
    }

    return imports.join('\n');
  }

  /**
   * Generate class declaration
   */
  private generateClassDeclaration(serviceName: string): string {
    return `@Injectable()
export class ${serviceName} {`;
  }

  /**
   * Generate constructor
   */
  private generateConstructor(repositoryName: string): string {
    const params = [`private readonly repository: ${repositoryName}`];

    if (this.options.enableCaching) {
      params.push(
        '@Inject(CACHE_MANAGER) private readonly cacheManager: Cache',
      );
    }

    if (this.options.enableTransactions) {
      params.push('private readonly dataSource: DataSource');
    }

    if (this.options.enableAuditLog) {
      params.push('private readonly auditLogService: AuditLogService');
    }

    return `  constructor(
    ${params.join(',\n    ')},
  ) {}
`;
  }

  /**
   * Generate CRUD methods
   */
  private generateCRUDMethods(
    entityName: string,
    repositoryName: string,
  ): string {
    const camelName = toCamelCase(entityName);
    const pkColumn = this.getPrimaryKeyColumn();
    const pkType = this.getTypeScriptType(pkColumn?.data_type || 'integer');
    const cacheKey = `${camelName}`;

    let createMethod = `
  /**
   * Create a new ${camelName}
   */
  async create(createDto: Create${entityName}Dto): Promise<${entityName}> {`;

    if (this.options.enableValidation) {
      createMethod += `
    // Validate unique constraints
    await this.validateUniqueConstraints(createDto);
`;
    }

    if (this.options.enableErrorHandling) {
      createMethod += `
    try {
      const ${camelName} = await this.repository.create(createDto);`;

      if (this.options.enableCaching) {
        createMethod += `
      
      // Invalidate cache
      await this.invalidateCache();`;
      }

      if (this.options.enableAuditLog) {
        createMethod += `
      
      // Log audit
      await this.auditLogService.log({
        entity: '${entityName}',
        entityId: ${camelName}.${pkColumn?.column_name || 'id'},
        action: 'CREATE',
        data: createDto,
      });`;
      }

      createMethod += `
      
      return ${camelName};
    } catch (error) {
      throw new BadRequestException(\`Failed to create ${camelName}: \${error.message}\`);
    }`;
    } else {
      createMethod += `
    const ${camelName} = await this.repository.create(createDto);`;

      if (this.options.enableCaching) {
        createMethod += `
    
    // Invalidate cache
    await this.invalidateCache();`;
      }

      if (this.options.enableAuditLog) {
        createMethod += `
    
    // Log audit
    await this.auditLogService.log({
      entity: '${entityName}',
      entityId: ${camelName}.${pkColumn?.column_name || 'id'},
      action: 'CREATE',
      data: createDto,
    });`;
      }

      createMethod += `
    
    return ${camelName};`;
    }

    createMethod += `
  }
`;

    let findAllMethod = `
  /**
   * Find all ${camelName}s
   */
  async findAll(): Promise<${entityName}[]> {`;

    if (this.options.enableCaching) {
      findAllMethod += `
    const cacheKey = '${cacheKey}:all';
    const cached = await this.cacheManager.get<${entityName}[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const ${camelName}s = await this.repository.findAll();
    await this.cacheManager.set(cacheKey, ${camelName}s, 300); // 5 minutes
    
    return ${camelName}s;`;
    } else {
      findAllMethod += `
    return this.repository.findAll();`;
    }

    findAllMethod += `
  }
`;

    let findOneMethod = `
  /**
   * Find one ${camelName} by ID
   */
  async findOne(id: ${pkType}): Promise<${entityName}> {`;

    if (this.options.enableCaching) {
      findOneMethod += `
    const cacheKey = \`${cacheKey}:\${id}\`;
    const cached = await this.cacheManager.get<${entityName}>(cacheKey);
    
    if (cached) {
      return cached;
    }
    `;
    }

    if (this.options.enableErrorHandling) {
      findOneMethod += `
    const ${camelName} = await this.repository.findOne(id);
    
    if (!${camelName}) {
      throw new NotFoundException(\`${entityName} with ID \${id} not found\`);
    }`;

      if (this.options.enableCaching) {
        findOneMethod += `
    
    await this.cacheManager.set(cacheKey, ${camelName}, 300);`;
      }

      findOneMethod += `
    
    return ${camelName};`;
    } else {
      findOneMethod += `
    const ${camelName} = await this.repository.findOne(id);`;

      if (this.options.enableCaching) {
        findOneMethod += `
    
    if (${camelName}) {
      await this.cacheManager.set(cacheKey, ${camelName}, 300);
    }`;
      }

      findOneMethod += `
    
    return ${camelName};`;
    }

    findOneMethod += `
  }
`;

    let updateMethod = `
  /**
   * Update a ${camelName}
   */
  async update(id: ${pkType}, updateDto: Update${entityName}Dto): Promise<${entityName}> {`;

    if (this.options.enableValidation) {
      updateMethod += `
    // Validate exists
    await this.findOne(id);
    
    // Validate unique constraints
    await this.validateUniqueConstraints(updateDto, id);
`;
    }

    if (this.options.enableErrorHandling) {
      updateMethod += `
    try {
      const ${camelName} = await this.repository.update(id, updateDto);`;

      if (this.options.enableCaching) {
        updateMethod += `
      
      // Invalidate cache
      await this.invalidateCache();
      await this.cacheManager.del(\`${cacheKey}:\${id}\`);`;
      }

      if (this.options.enableAuditLog) {
        updateMethod += `
      
      // Log audit
      await this.auditLogService.log({
        entity: '${entityName}',
        entityId: id,
        action: 'UPDATE',
        data: updateDto,
      });`;
      }

      updateMethod += `
      
      return ${camelName};
    } catch (error) {
      throw new BadRequestException(\`Failed to update ${camelName}: \${error.message}\`);
    }`;
    } else {
      updateMethod += `
    const ${camelName} = await this.repository.update(id, updateDto);`;

      if (this.options.enableCaching) {
        updateMethod += `
    
    // Invalidate cache
    await this.invalidateCache();
    await this.cacheManager.del(\`${cacheKey}:\${id}\`);`;
      }

      if (this.options.enableAuditLog) {
        updateMethod += `
    
    // Log audit
    await this.auditLogService.log({
      entity: '${entityName}',
      entityId: id,
      action: 'UPDATE',
      data: updateDto,
    });`;
      }

      updateMethod += `
    
    return ${camelName};`;
    }

    updateMethod += `
  }
`;

    let removeMethod = `
  /**
   * Remove a ${camelName}
   */
  async remove(id: ${pkType}): Promise<void> {`;

    if (this.options.enableValidation) {
      removeMethod += `
    // Validate exists
    await this.findOne(id);
`;
    }

    if (this.options.enableErrorHandling) {
      removeMethod += `
    try {
      await this.repository.remove(id);`;

      if (this.options.enableCaching) {
        removeMethod += `
      
      // Invalidate cache
      await this.invalidateCache();
      await this.cacheManager.del(\`${cacheKey}:\${id}\`);`;
      }

      if (this.options.enableAuditLog) {
        removeMethod += `
      
      // Log audit
      await this.auditLogService.log({
        entity: '${entityName}',
        entityId: id,
        action: 'DELETE',
      });`;
      }

      removeMethod += `
    } catch (error) {
      throw new BadRequestException(\`Failed to remove ${camelName}: \${error.message}\`);
    }`;
    } else {
      removeMethod += `
    await this.repository.remove(id);`;

      if (this.options.enableCaching) {
        removeMethod += `
    
    // Invalidate cache
    await this.invalidateCache();
    await this.cacheManager.del(\`${cacheKey}:\${id}\`);`;
      }

      if (this.options.enableAuditLog) {
        removeMethod += `
    
    // Log audit
    await this.auditLogService.log({
      entity: '${entityName}',
      entityId: id,
      action: 'DELETE',
    });`;
      }
    }

    removeMethod += `
  }
`;

    return (
      createMethod + findAllMethod + findOneMethod + updateMethod + removeMethod
    );
  }

  /**
   * Generate filter methods
   */
  private generateFilterMethods(
    entityName: string,
    filterDtoName: string,
    repositoryName: string,
  ): string {
    const camelName = toCamelCase(entityName);
    const cacheKey = `${camelName}`;

    let method = `
  /**
   * Find ${camelName}s with filters
   */
  async findWithFilters(
    filterDto: ${filterDtoName},
    options?: { page?: number; limit?: number; sort?: Array<{ field: string; order: 'ASC' | 'DESC' }> },
  ): Promise<{ data: ${entityName}[]; total: number; page: number; limit: number }> {`;

    if (this.options.enableCaching) {
      method += `
    const cacheKey = \`${cacheKey}:filter:\${JSON.stringify({ filterDto, options })}\`;
    const cached = await this.cacheManager.get<{ data: ${entityName}[]; total: number; page: number; limit: number }>(cacheKey);
    
    if (cached) {
      return cached;
    }
    `;
    }

    method += `
    const result = await this.repository.findWithFilters(filterDto, options);`;

    if (this.options.enableCaching) {
      method += `
    
    await this.cacheManager.set(cacheKey, result, 300);`;
    }

    method += `
    
    return result;
  }
`;

    return method;
  }

  /**
   * Generate custom methods
   */
  private generateCustomMethods(
    entityName: string,
    repositoryName: string,
  ): string {
    const camelName = toCamelCase(entityName);
    const cacheKey = `${camelName}`;

    let methods = '';

    // Count method
    methods += `
  /**
   * Count ${camelName}s
   */
  async count(): Promise<number> {`;

    if (this.options.enableCaching) {
      methods += `
    const cacheKey = '${cacheKey}:count';
    const cached = await this.cacheManager.get<number>(cacheKey);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const count = await this.repository.count();
    await this.cacheManager.set(cacheKey, count, 300);
    
    return count;`;
    } else {
      methods += `
    return this.repository.count();`;
    }

    methods += `
  }
`;

    // Exists method
    methods += `
  /**
   * Check if ${camelName} exists
   */
  async exists(id: number): Promise<boolean> {`;

    if (this.options.enableCaching) {
      methods += `
    const cacheKey = \`${cacheKey}:\${id}:exists\`;
    const cached = await this.cacheManager.get<boolean>(cacheKey);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const exists = await this.repository.exists({ id } as any);
    await this.cacheManager.set(cacheKey, exists, 300);
    
    return exists;`;
    } else {
      methods += `
    return this.repository.exists({ id } as any);`;
    }

    methods += `
  }
`;

    // Validation helper method
    if (this.options.enableValidation) {
      methods += `
  /**
   * Validate unique constraints
   */
  private async validateUniqueConstraints(
    data: Create${entityName}Dto | Update${entityName}Dto,
    excludeId?: number,
  ): Promise<void> {
    // Add custom validation logic here based on unique columns
    // Example: Check if email already exists
    ${this.generateUniqueValidation(entityName, 'excludeId')}
  }
`;
    }

    // Cache invalidation helper
    if (this.options.enableCaching) {
      methods += `
  /**
   * Invalidate all cache for ${camelName}
   */
  private async invalidateCache(): Promise<void> {
    // Invalidate all related cache keys
    const keys = await this.cacheManager.store.keys();
    const ${camelName}Keys = keys.filter((key: string) => key.startsWith('${cacheKey}:'));
    
    for (const key of ${camelName}Keys) {
      await this.cacheManager.del(key);
    }
  }
`;
    }

    // Transaction helper
    if (this.options.enableTransactions) {
      methods += `
  /**
   * Execute in transaction
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback();
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
`;
    }

    return methods;
  }

  /**
   * Generate unique validation logic
   */
  private generateUniqueValidation(
    entityName: string,
    excludeIdParam: string,
  ): string {
    const uniqueColumns = this.columns.filter((col) => col.is_unique);

    if (uniqueColumns.length === 0) {
      return '// No unique constraints defined';
    }

    const validations = uniqueColumns.map((col) => {
      const fieldName = col.column_name;
      return `    if ('${fieldName}' in data && data.${fieldName}) {
      const existing = await this.repository.findOneBy({ ${fieldName}: data.${fieldName} } as any);
      if (existing && (!${excludeIdParam} || existing.id !== ${excludeIdParam})) {
        throw new ConflictException('${fieldName} already exists');
      }
    }`;
    });

    return validations.join('\n    ');
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
