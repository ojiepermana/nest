import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { BillingTermRepository } from '../repositories/billing-term.repository';
import { BillingTerm } from '../entities/billing-term.entity';
import { CreateBillingTermDto } from '../dto/billing-term/create-billing-term.dto';
import { UpdateBillingTermDto } from '../dto/billing-term/update-billing-term.dto';
import { BillingTermFilterDto } from '../dto/billing-term/billing-term-filter.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { AuditLogService } from '@ojiepermana/nest-generator/audit';

@Injectable()
export class BillingTermService {
  constructor(
    private readonly repository: BillingTermRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly auditLogService: AuditLogService,
  ) {}


  /**
   * Create a new billingterm
   */
  async create(createDto: CreateBillingTermDto): Promise<BillingTerm> {
    // Validate unique constraints
    await this.validateUniqueConstraints(createDto);

    const billingterm = await this.repository.create(createDto);
    
    // Invalidate cache
    await this.invalidateCache();
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'BillingTerm',
      entity_id: String(billingterm.id),
      action: 'CREATE',
      new_values: createDto,
      user_id: 'system', // TODO: Get from context
    });
    
    return billingterm;
  }

  /**
   * Find all billingterms
   */
  async findAll(): Promise<BillingTerm[]> {
    const cacheKey = 'billingterm:all';
    const cached = await this.cacheManager.get<BillingTerm[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const billingterms = await this.repository.findAll();
    await this.cacheManager.set(cacheKey, billingterms, 300); // 5 minutes
    
    return billingterms;
  }

  /**
   * Find one billingterm by ID
   */
  async findOne(id: string): Promise<BillingTerm> {
    const cacheKey = `billingterm:${id}`;
    const cached = await this.cacheManager.get<BillingTerm>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const billingterm = await this.repository.findOne(id);
    
    if (billingterm) {
      await this.cacheManager.set(cacheKey, billingterm, 300);
    }
    
    return billingterm;
  }

  /**
   * Update a billingterm
   */
  async update(id: string, updateDto: UpdateBillingTermDto): Promise<BillingTerm> {
    // Validate exists
    await this.findOne(id);
    
    // Validate unique constraints
    await this.validateUniqueConstraints(updateDto, id);

    const billingterm = await this.repository.update(id, updateDto);
    
    // Invalidate cache
    await this.invalidateCache();
    await this.cacheManager.del(`billingterm:${id}`);
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'BillingTerm',
      entity_id: String(id),
      action: 'UPDATE',
      new_values: updateDto,
      user_id: 'system', // TODO: Get from context
    });
    
    return billingterm;
  }

  /**
   * Remove a billingterm
   */
  async remove(id: string): Promise<void> {
    // Validate exists
    await this.findOne(id);

    await this.repository.delete(id);
    
    // Invalidate cache
    await this.invalidateCache();
    await this.cacheManager.del(`billingterm:${id}`);
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'BillingTerm',
      entity_id: String(id),
      action: 'DELETE',
      user_id: 'system', // TODO: Get from context
    });
  }


  /**
   * Find billingterms with filters
   */
  async findWithFilters(
    filterDto: BillingTermFilterDto,
    options?: { page?: number; limit?: number; sort?: Array<{ field: string; order: 'ASC' | 'DESC' }> },
  ): Promise<{ data: BillingTerm[]; total: number; page: number; limit: number }> {
    const cacheKey = `billingterm:filter:${JSON.stringify({ filterDto, options })}`;
    const cached = await this.cacheManager.get<{ data: BillingTerm[]; total: number; page: number; limit: number }>(cacheKey);
    
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
   * Count billingterms
   */
  async count(): Promise<number> {
    const cacheKey = 'billingterm:count';
    const cached = await this.cacheManager.get<number>(cacheKey);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const count = await this.repository.count();
    await this.cacheManager.set(cacheKey, count, 300);
    
    return count;
  }

  /**
   * Check if billingterm exists
   */
  async exists(id: number): Promise<boolean> {
    const cacheKey = `billingterm:${id}:exists`;
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
    data: CreateBillingTermDto | UpdateBillingTermDto,
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
   * Invalidate all cache for billingterm
   */
  private async invalidateCache(): Promise<void> {
    // Invalidate common cache keys
    await this.cacheManager.del('billingterm:all');
    
    // Note: cache-manager v5 doesn't support listing all keys
    // For production, consider using a cache with pattern-based deletion
    // or maintain a list of cache keys in your application
  }

}
