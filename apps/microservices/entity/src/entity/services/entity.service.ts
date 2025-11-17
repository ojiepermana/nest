import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { EntityRepository } from '../repositories/entity.repository';
import { Entity } from '../entities/entity.entity';
import { CreateEntityDto } from '../dto/entity/create-entity.dto';
import { UpdateEntityDto } from '../dto/entity/update-entity.dto';
import { EntityFilterDto } from '../dto/entity/entity-filter.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { AuditLogService } from '@ojiepermana/nest-generator/audit';

@Injectable()
export class EntityService {
  constructor(
    private readonly repository: EntityRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly auditLogService: AuditLogService,
  ) {}


  /**
   * Create a new entity
   */
  async create(createDto: CreateEntityDto): Promise<Entity> {
    // Validate unique constraints
    await this.validateUniqueConstraints(createDto);

    const entity = await this.repository.create(createDto);
    
    // Invalidate cache
    await this.invalidateCache();
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'Entity',
      entity_id: String(entity.id),
      action: 'CREATE',
      new_values: createDto,
      user_id: 'system', // TODO: Get from context
    });
    
    return entity;
  }

  /**
   * Find all entitys
   */
  async findAll(): Promise<Entity[]> {
    const cacheKey = 'entity:all';
    const cached = await this.cacheManager.get<Entity[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const entitys = await this.repository.findAll();
    await this.cacheManager.set(cacheKey, entitys, 300); // 5 minutes
    
    return entitys;
  }

  /**
   * Find one entity by ID
   */
  async findOne(id: string): Promise<Entity> {
    const cacheKey = `entity:${id}`;
    const cached = await this.cacheManager.get<Entity>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const entity = await this.repository.findOne(id);
    
    if (entity) {
      await this.cacheManager.set(cacheKey, entity, 300);
    }
    
    return entity;
  }

  /**
   * Update a entity
   */
  async update(id: string, updateDto: UpdateEntityDto): Promise<Entity> {
    // Validate exists
    await this.findOne(id);
    
    // Validate unique constraints
    await this.validateUniqueConstraints(updateDto, id);

    const entity = await this.repository.update(id, updateDto);
    
    // Invalidate cache
    await this.invalidateCache();
    await this.cacheManager.del(`entity:${id}`);
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'Entity',
      entity_id: String(id),
      action: 'UPDATE',
      new_values: updateDto,
      user_id: 'system', // TODO: Get from context
    });
    
    return entity;
  }

  /**
   * Remove a entity
   */
  async remove(id: string): Promise<void> {
    // Validate exists
    await this.findOne(id);

    await this.repository.delete(id);
    
    // Invalidate cache
    await this.invalidateCache();
    await this.cacheManager.del(`entity:${id}`);
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'Entity',
      entity_id: String(id),
      action: 'DELETE',
      user_id: 'system', // TODO: Get from context
    });
  }


  /**
   * Find entitys with filters
   */
  async findWithFilters(
    filterDto: EntityFilterDto,
    options?: { page?: number; limit?: number; sort?: Array<{ field: string; order: 'ASC' | 'DESC' }> },
  ): Promise<{ data: Entity[]; total: number; page: number; limit: number }> {
    const cacheKey = `entity:filter:${JSON.stringify({ filterDto, options })}`;
    const cached = await this.cacheManager.get<{ data: Entity[]; total: number; page: number; limit: number }>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const { data, total } = await this.repository.findWithFilters(filterDto, options);
    
    const result = {
      data,
      total,
      page: options?.page || 1,
      limit: options?.limit || 20,
    };
    
    await this.cacheManager.set(cacheKey, result, 300);
    
    return result;
  }


  /**
   * Count entitys
   */
  async count(): Promise<number> {
    const cacheKey = 'entity:count';
    const cached = await this.cacheManager.get<number>(cacheKey);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const count = await this.repository.count();
    await this.cacheManager.set(cacheKey, count, 300);
    
    return count;
  }

  /**
   * Check if entity exists
   */
  async exists(id: number): Promise<boolean> {
    const cacheKey = `entity:${id}:exists`;
    const cached = await this.cacheManager.get<boolean>(cacheKey);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const exists = await this.repository.exists({ id } as any);
    await this.cacheManager.set(cacheKey, exists, 300);
    
    return exists;
  }

  /**
   * Validate unique constraints
   */
  private async validateUniqueConstraints(
    data: CreateEntityDto | UpdateEntityDto,
    excludeId?: string,
  ): Promise<void> {
    // Add custom validation logic here based on unique columns
    // Example: Check if email already exists
        if ('id' in data && data.id) {
      const existing = await this.repository.findOne(data.id as string);
      if (existing && (!excludeId || existing.id !== excludeId)) {
        throw new ConflictException('id already exists');
      }
    }
  }

  /**
   * Invalidate all cache for entity
   */
  private async invalidateCache(): Promise<void> {
    // Invalidate common cache keys
    await this.cacheManager.del('entity:all');
    
    // Note: cache-manager v5 doesn't support listing all keys
    // For production, consider using a cache with pattern-based deletion
    // or maintain a list of cache keys in your application
  }

}
