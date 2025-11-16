import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { LocationTypeRepository } from '../repositories/location-type.repository';
import { LocationType } from '../entities/location-type.entity';
import { CreateLocationTypeDto } from '../dto/location-type/create-location-type.dto';
import { UpdateLocationTypeDto } from '../dto/location-type/update-location-type.dto';
import { LocationTypeFilterDto } from '../dto/location-type/location-type-filter.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { AuditLogService } from '@ojiepermana/nest-generator/audit';

@Injectable()
export class LocationTypeService {
  constructor(
    private readonly repository: LocationTypeRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly auditLogService: AuditLogService,
  ) {}


  /**
   * Create a new locationtype
   */
  async create(createDto: CreateLocationTypeDto): Promise<LocationType> {
    const locationtype = await this.repository.create(createDto);
    
    // Invalidate cache
    await this.invalidateCache();
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'LocationType',
      entity_id: String(locationtype.id),
      action: 'CREATE',
      new_values: createDto,
      user_id: 'system', // TODO: Get from context
    });
    
    return locationtype;
  }

  /**
   * Find all locationtypes
   */
  async findAll(): Promise<LocationType[]> {
    const cacheKey = 'locationtype:all';
    const cached = await this.cacheManager.get<LocationType[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const locationtypes = await this.repository.findAll();
    await this.cacheManager.set(cacheKey, locationtypes, 300); // 5 minutes
    
    return locationtypes;
  }

  /**
   * Find one locationtype by ID
   */
  async findOne(id: string): Promise<LocationType> {
    const cacheKey = `locationtype:${id}`;
    const cached = await this.cacheManager.get<LocationType>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const locationtype = await this.repository.findOne(id);
    
    if (locationtype) {
      await this.cacheManager.set(cacheKey, locationtype, 300);
    }
    
    return locationtype;
  }

  /**
   * Update a locationtype
   */
  async update(id: string, updateDto: UpdateLocationTypeDto): Promise<LocationType> {
    const locationtype = await this.repository.update(id, updateDto);
    
    // Invalidate cache
    await this.invalidateCache();
    await this.cacheManager.del(`locationtype:${id}`);
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'LocationType',
      entity_id: String(id),
      action: 'UPDATE',
      new_values: updateDto,
      user_id: 'system', // TODO: Get from context
    });
    
    return locationtype;
  }

  /**
   * Remove a locationtype
   */
  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
    
    // Invalidate cache
    await this.invalidateCache();
    await this.cacheManager.del(`locationtype:${id}`);
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'LocationType',
      entity_id: String(id),
      action: 'DELETE',
      user_id: 'system', // TODO: Get from context
    });
  }


  /**
   * Find locationtypes with filters
   */
  async findWithFilters(
    filterDto: LocationTypeFilterDto,
    options?: { page?: number; limit?: number; sort?: Array<{ field: string; order: 'ASC' | 'DESC' }> },
  ): Promise<{ data: LocationType[]; total: number; page: number; limit: number }> {
    const cacheKey = `locationtype:filter:${JSON.stringify({ filterDto, options })}`;
    const cached = await this.cacheManager.get<{ data: LocationType[]; total: number; page: number; limit: number }>(cacheKey);
    
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
   * Count locationtypes
   */
  async count(): Promise<number> {
    const cacheKey = 'locationtype:count';
    const cached = await this.cacheManager.get<number>(cacheKey);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const count = await this.repository.count();
    await this.cacheManager.set(cacheKey, count, 300);
    
    return count;
  }

  /**
   * Check if locationtype exists
   */
  async exists(id: number): Promise<boolean> {
    const cacheKey = `locationtype:${id}:exists`;
    const cached = await this.cacheManager.get<boolean>(cacheKey);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const exists = await this.repository.exists({ id } as any);
    await this.cacheManager.set(cacheKey, exists, 300);
    
    return exists;
  }

  /**
   * Invalidate all cache for locationtype
   */
  private async invalidateCache(): Promise<void> {
    // Invalidate common cache keys
    await this.cacheManager.del('locationtype:all');
    
    // Note: cache-manager v5 doesn't support listing all keys
    // For production, consider using a cache with pattern-based deletion
    // or maintain a list of cache keys in your application
  }

}
