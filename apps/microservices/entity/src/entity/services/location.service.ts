import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { LocationRepository } from '../repositories/location.repository';
import { Location } from '../entities/location.entity';
import { CreateLocationDto } from '../dto/location/create-location.dto';
import { UpdateLocationDto } from '../dto/location/update-location.dto';
import { LocationFilterDto } from '../dto/location/location-filter.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { AuditLogService } from '@ojiepermana/nest-generator/audit';

@Injectable()
export class LocationService {
  constructor(
    private readonly repository: LocationRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly auditLogService: AuditLogService,
  ) {}


  /**
   * Create a new location
   */
  async create(createDto: CreateLocationDto): Promise<Location> {
    // Validate unique constraints
    await this.validateUniqueConstraints(createDto);

    const location = await this.repository.create(createDto);
    
    // Invalidate cache
    await this.invalidateCache();
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'Location',
      entity_id: String(location.id),
      action: 'CREATE',
      new_values: createDto,
      user_id: 'system', // TODO: Get from context
    });
    
    return location;
  }

  /**
   * Find all locations
   */
  async findAll(): Promise<Location[]> {
    const cacheKey = 'location:all';
    const cached = await this.cacheManager.get<Location[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const locations = await this.repository.findAll();
    await this.cacheManager.set(cacheKey, locations, 300); // 5 minutes
    
    return locations;
  }

  /**
   * Find one location by ID
   */
  async findOne(id: string): Promise<Location> {
    const cacheKey = `location:${id}`;
    const cached = await this.cacheManager.get<Location>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const location = await this.repository.findOne(id);
    
    if (location) {
      await this.cacheManager.set(cacheKey, location, 300);
    }
    
    return location;
  }

  /**
   * Update a location
   */
  async update(id: string, updateDto: UpdateLocationDto): Promise<Location> {
    // Validate exists
    await this.findOne(id);
    
    // Validate unique constraints
    await this.validateUniqueConstraints(updateDto, id);

    const location = await this.repository.update(id, updateDto);
    
    // Invalidate cache
    await this.invalidateCache();
    await this.cacheManager.del(`location:${id}`);
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'Location',
      entity_id: String(id),
      action: 'UPDATE',
      new_values: updateDto,
      user_id: 'system', // TODO: Get from context
    });
    
    return location;
  }

  /**
   * Remove a location
   */
  async remove(id: string): Promise<void> {
    // Validate exists
    await this.findOne(id);

    await this.repository.delete(id);
    
    // Invalidate cache
    await this.invalidateCache();
    await this.cacheManager.del(`location:${id}`);
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'Location',
      entity_id: String(id),
      action: 'DELETE',
      user_id: 'system', // TODO: Get from context
    });
  }


  /**
   * Find locations with filters
   */
  async findWithFilters(
    filterDto: LocationFilterDto,
    options?: { page?: number; limit?: number; sort?: Array<{ field: string; order: 'ASC' | 'DESC' }> },
  ): Promise<{ data: Location[]; total: number; page: number; limit: number }> {
    const cacheKey = `location:filter:${JSON.stringify({ filterDto, options })}`;
    const cached = await this.cacheManager.get<{ data: Location[]; total: number; page: number; limit: number }>(cacheKey);
    
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
   * Count locations
   */
  async count(): Promise<number> {
    const cacheKey = 'location:count';
    const cached = await this.cacheManager.get<number>(cacheKey);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const count = await this.repository.count();
    await this.cacheManager.set(cacheKey, count, 300);
    
    return count;
  }

  /**
   * Check if location exists
   */
  async exists(id: number): Promise<boolean> {
    const cacheKey = `location:${id}:exists`;
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
    data: CreateLocationDto | UpdateLocationDto,
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
   * Invalidate all cache for location
   */
  private async invalidateCache(): Promise<void> {
    // Invalidate common cache keys
    await this.cacheManager.del('location:all');
    
    // Note: cache-manager v5 doesn't support listing all keys
    // For production, consider using a cache with pattern-based deletion
    // or maintain a list of cache keys in your application
  }

}
