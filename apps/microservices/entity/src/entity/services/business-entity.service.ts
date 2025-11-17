import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { BusinessEntityRepository } from '../repositories/business-entity.repository';
import { BusinessEntity } from '../entities/business-entity.entity';
import { CreateBusinessEntityDto } from '../dto/business-entity/create-business-entity.dto';
import { UpdateBusinessEntityDto } from '../dto/business-entity/update-business-entity.dto';
import { BusinessEntityFilterDto } from '../dto/business-entity/business-entity-filter.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { AuditLogService } from '@ojiepermana/nest-generator/audit';

@Injectable()
export class BusinessEntityService {
  constructor(
    private readonly repository: BusinessEntityRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly auditLogService: AuditLogService,
  ) {}


  /**
   * Create a new businessentity
   */
  async create(createDto: CreateBusinessEntityDto): Promise<BusinessEntity> {
    // Validate unique constraints
    await this.validateUniqueConstraints(createDto);

    const businessentity = await this.repository.create(createDto);
    
    // Invalidate cache
    await this.invalidateCache();
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'BusinessEntity',
      entity_id: String(businessentity.id),
      action: 'CREATE',
      new_values: createDto,
      user_id: 'system', // TODO: Get from context
    });
    
    return businessentity;
  }

  /**
   * Find all businessentitys
   */
  async findAll(): Promise<BusinessEntity[]> {
    const cacheKey = 'businessentity:all';
    const cached = await this.cacheManager.get<BusinessEntity[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const businessentitys = await this.repository.findAll();
    await this.cacheManager.set(cacheKey, businessentitys, 300); // 5 minutes
    
    return businessentitys;
  }

  /**
   * Find one businessentity by ID
   */
  async findOne(id: string): Promise<BusinessEntity> {
    const cacheKey = `businessentity:${id}`;
    const cached = await this.cacheManager.get<BusinessEntity>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const businessentity = await this.repository.findOne(id);
    
    if (businessentity) {
      await this.cacheManager.set(cacheKey, businessentity, 300);
    }
    
    return businessentity;
  }

  /**
   * Update a businessentity
   */
  async update(id: string, updateDto: UpdateBusinessEntityDto): Promise<BusinessEntity> {
    // Validate exists
    await this.findOne(id);
    
    // Validate unique constraints
    await this.validateUniqueConstraints(updateDto, id);

    const businessentity = await this.repository.update(id, updateDto);
    
    // Invalidate cache
    await this.invalidateCache();
    await this.cacheManager.del(`businessentity:${id}`);
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'BusinessEntity',
      entity_id: String(id),
      action: 'UPDATE',
      new_values: updateDto,
      user_id: 'system', // TODO: Get from context
    });
    
    return businessentity;
  }

  /**
   * Remove a businessentity
   */
  async remove(id: string): Promise<void> {
    // Validate exists
    await this.findOne(id);

    await this.repository.delete(id);
    
    // Invalidate cache
    await this.invalidateCache();
    await this.cacheManager.del(`businessentity:${id}`);
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'BusinessEntity',
      entity_id: String(id),
      action: 'DELETE',
      user_id: 'system', // TODO: Get from context
    });
  }


  /**
   * Find businessentitys with filters
   */
  async findWithFilters(
    filterDto: BusinessEntityFilterDto,
    options?: { page?: number; limit?: number; sort?: Array<{ field: string; order: 'ASC' | 'DESC' }> },
  ): Promise<{ data: BusinessEntity[]; total: number; page: number; limit: number }> {
    const cacheKey = `businessentity:filter:${JSON.stringify({ filterDto, options })}`;
    const cached = await this.cacheManager.get<{ data: BusinessEntity[]; total: number; page: number; limit: number }>(cacheKey);
    
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
   * Count businessentitys
   */
  async count(): Promise<number> {
    const cacheKey = 'businessentity:count';
    const cached = await this.cacheManager.get<number>(cacheKey);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const count = await this.repository.count();
    await this.cacheManager.set(cacheKey, count, 300);
    
    return count;
  }

  /**
   * Check if businessentity exists
   */
  async exists(id: number): Promise<boolean> {
    const cacheKey = `businessentity:${id}:exists`;
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
    data: CreateBusinessEntityDto | UpdateBusinessEntityDto,
    excludeId?: string,
  ): Promise<void> {
    // Add custom validation logic here based on unique columns
    // Example: Check if email already exists
        if ('code' in data && data.code) {
      const existing = await this.repository.findOne(data.code as string);
      if (existing && (!excludeId || existing.id !== excludeId)) {
        throw new ConflictException('code already exists');
      }
    }
        if ('id' in data && data.id) {
      const existing = await this.repository.findOne(data.id as string);
      if (existing && (!excludeId || existing.id !== excludeId)) {
        throw new ConflictException('id already exists');
      }
    }
        if ('old_id' in data && data.old_id) {
      const existing = await this.repository.findOne(data.old_id as string);
      if (existing && (!excludeId || existing.id !== excludeId)) {
        throw new ConflictException('old_id already exists');
      }
    }
  }

  /**
   * Invalidate all cache for businessentity
   */
  private async invalidateCache(): Promise<void> {
    // Invalidate common cache keys
    await this.cacheManager.del('businessentity:all');
    
    // Note: cache-manager v5 doesn't support listing all keys
    // For production, consider using a cache with pattern-based deletion
    // or maintain a list of cache keys in your application
  }

}
