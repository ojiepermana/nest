/**
 * Cache Repository Generator
 *
 * Generates repository methods with Redis caching support
 * Auto-invalidates cache on mutations (create/update/delete)
 */

import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';
import { toPascalCase, toCamelCase } from '../../utils/string.util';

export interface CacheRepositoryGeneratorOptions {
  tableName: string;
  enableCache?: boolean;
  defaultTTL?: number; // milliseconds
}

export class CacheRepositoryGenerator {
  constructor(
    private tableMetadata: TableMetadata,
    private columns: ColumnMetadata[],
    private options: CacheRepositoryGeneratorOptions,
  ) {}

  /**
   * Generate cache imports
   */
  generateImports(): string[] {
    if (!this.options.enableCache) {
      return [];
    }

    return [
      "import { Inject } from '@nestjs/common';",
      "import { ICacheService } from '../cache/cache.interface';",
      "import { CacheKeyBuilder } from '../cache/cache.interface';",
    ];
  }

  /**
   * Generate cache service injection in constructor
   */
  generateConstructorInjection(): string {
    if (!this.options.enableCache) {
      return '';
    }

    return `
  constructor(
    private readonly pool: Pool,
    @Inject('CACHE_SERVICE') private readonly cacheService: ICacheService,
  ) {}`;
  }

  /**
   * Generate cached findAll method
   */
  generateCachedFindAll(entityName: string): string {
    const ttl = this.options.defaultTTL || 300000; // 5 minutes

    return `
  // GENERATED_METHOD_START: find-all-cached
  async findAll(filters?: ${entityName}FilterDto, page = 1, limit = 10): Promise<${entityName}[]> {
    // Build cache key
    const cacheKey = CacheKeyBuilder.create('${this.options.tableName}')
      .operation('list')
      .query({ filters, page, limit })
      .build();

    // Try cache first
    const cached = await this.cacheService.get<${entityName}[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const result = await this.pool.query(
      ${entityName}Queries.findAll,
      [limit, (page - 1) * limit]
    );

    // Cache result
    await this.cacheService.set(cacheKey, result.rows, { ttl: ${ttl} });

    return result.rows;
  }
  // GENERATED_METHOD_END: find-all-cached
`;
  }

  /**
   * Generate cached findOne method
   */
  generateCachedFindOne(entityName: string): string {
    const ttl = this.options.defaultTTL || 300000;

    return `
  // GENERATED_METHOD_START: find-one-cached
  async findOne(id: string): Promise<${entityName} | null> {
    // Build cache key
    const cacheKey = CacheKeyBuilder.create('${this.options.tableName}')
      .operation('detail')
      .id(id)
      .build();

    // Try cache first
    const cached = await this.cacheService.get<${entityName}>(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const result = await this.pool.query(
      ${entityName}Queries.findOne,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const entity = result.rows[0];

    // Cache result
    await this.cacheService.set(cacheKey, entity, { ttl: ${ttl} });

    return entity;
  }
  // GENERATED_METHOD_END: find-one-cached
`;
  }

  /**
   * Generate create method with cache invalidation
   */
  generateCreateWithInvalidation(entityName: string): string {
    return `
  // GENERATED_METHOD_START: create-with-invalidation
  async create(dto: Create${entityName}Dto, createdBy: string): Promise<${entityName}> {
    const result = await this.pool.query(
      ${entityName}Queries.create,
      [/* parameters */]
    );

    const created = result.rows[0];

    // Invalidate list cache
    const pattern = CacheKeyBuilder.create('${this.options.tableName}')
      .operation('list')
      .pattern();
    await this.cacheService.deletePattern(pattern);

    return created;
  }
  // GENERATED_METHOD_END: create-with-invalidation
`;
  }

  /**
   * Generate update method with cache invalidation
   */
  generateUpdateWithInvalidation(entityName: string): string {
    return `
  // GENERATED_METHOD_START: update-with-invalidation
  async update(id: string, dto: Update${entityName}Dto, updatedBy: string): Promise<${entityName}> {
    const result = await this.pool.query(
      ${entityName}Queries.update,
      [/* parameters */]
    );

    if (result.rows.length === 0) {
      throw new Error('${entityName} not found');
    }

    const updated = result.rows[0];

    // Invalidate caches
    const detailKey = CacheKeyBuilder.create('${this.options.tableName}')
      .operation('detail')
      .id(id)
      .build();
    
    const listPattern = CacheKeyBuilder.create('${this.options.tableName}')
      .operation('list')
      .pattern();

    await this.cacheService.delete(detailKey);
    await this.cacheService.deletePattern(listPattern);

    return updated;
  }
  // GENERATED_METHOD_END: update-with-invalidation
`;
  }

  /**
   * Generate delete method with cache invalidation
   */
  generateDeleteWithInvalidation(entityName: string): string {
    return `
  // GENERATED_METHOD_START: delete-with-invalidation
  async remove(id: string, deletedBy: string): Promise<{ id: string }> {
    const result = await this.pool.query(
      ${entityName}Queries.softDelete,
      [id, deletedBy, new Date()]
    );

    if (result.rowCount === 0) {
      throw new Error('${entityName} not found');
    }

    // Invalidate caches
    const detailKey = CacheKeyBuilder.create('${this.options.tableName}')
      .operation('detail')
      .id(id)
      .build();
    
    const listPattern = CacheKeyBuilder.create('${this.options.tableName}')
      .operation('list')
      .pattern();

    await this.cacheService.delete(detailKey);
    await this.cacheService.deletePattern(listPattern);

    return { id };
  }
  // GENERATED_METHOD_END: delete-with-invalidation
`;
  }

  /**
   * Generate complete cached repository
   */
  generate(): string {
    const entityName = toPascalCase(this.options.tableName);

    if (!this.options.enableCache) {
      return ''; // Return empty if cache disabled
    }

    return `
${this.generateImports().join('\n')}

export class ${entityName}Repository {
${this.generateConstructorInjection()}

${this.generateCachedFindAll(entityName)}

${this.generateCachedFindOne(entityName)}

${this.generateCreateWithInvalidation(entityName)}

${this.generateUpdateWithInvalidation(entityName)}

${this.generateDeleteWithInvalidation(entityName)}

  // CUSTOM_METHOD_START: custom-methods
  // Add your custom repository methods here
  // CUSTOM_METHOD_END: custom-methods
}
`;
  }
}
