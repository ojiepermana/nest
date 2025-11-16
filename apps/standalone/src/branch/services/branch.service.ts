import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { BranchRepository } from '../repositories/branch.repository';
import { Branch } from '../entities/branch.entity';
import { CreateBranchDto } from '../dto/branch/create-branch.dto';
import { UpdateBranchDto } from '../dto/branch/update-branch.dto';
import { BranchFilterDto } from '../dto/branch/branch-filter.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { AuditLogService } from '@ojiepermana/nest-generator/audit';

@Injectable()
export class BranchService {
  constructor(
    private readonly repository: BranchRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly auditLogService: AuditLogService,
  ) {}


  /**
   * Create a new branch
   */
  async create(createDto: CreateBranchDto): Promise<Branch> {
    // Validate unique constraints
    await this.validateUniqueConstraints(createDto);

    const branch = await this.repository.create(createDto);
    
    // Invalidate cache
    await this.invalidateCache();
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'Branch',
      entity_id: String(branch.id),
      action: 'CREATE',
      new_values: createDto,
      user_id: 'system', // TODO: Get from context
    });
    
    return branch;
  }

  /**
   * Find all branchs
   */
  async findAll(): Promise<Branch[]> {
    const cacheKey = 'branch:all';
    const cached = await this.cacheManager.get<Branch[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const branchs = await this.repository.findAll();
    await this.cacheManager.set(cacheKey, branchs, 300); // 5 minutes
    
    return branchs;
  }

  /**
   * Find one branch by ID
   */
  async findOne(id: string): Promise<Branch> {
    const cacheKey = `branch:${id}`;
    const cached = await this.cacheManager.get<Branch>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const branch = await this.repository.findOne(id);
    
    if (branch) {
      await this.cacheManager.set(cacheKey, branch, 300);
    }
    
    return branch;
  }

  /**
   * Update a branch
   */
  async update(id: string, updateDto: UpdateBranchDto): Promise<Branch> {
    // Validate exists
    await this.findOne(id);
    
    // Validate unique constraints
    await this.validateUniqueConstraints(updateDto, id);

    const branch = await this.repository.update(id, updateDto);
    
    // Invalidate cache
    await this.invalidateCache();
    await this.cacheManager.del(`branch:${id}`);
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'Branch',
      entity_id: String(id),
      action: 'UPDATE',
      new_values: updateDto,
      user_id: 'system', // TODO: Get from context
    });
    
    return branch;
  }

  /**
   * Remove a branch
   */
  async remove(id: string): Promise<void> {
    // Validate exists
    await this.findOne(id);

    await this.repository.delete(id);
    
    // Invalidate cache
    await this.invalidateCache();
    await this.cacheManager.del(`branch:${id}`);
    
    // Log audit
    await this.auditLogService.log({
      entity_type: 'Branch',
      entity_id: String(id),
      action: 'DELETE',
      user_id: 'system', // TODO: Get from context
    });
  }


  /**
   * Find branchs with filters
   */
  async findWithFilters(
    filterDto: BranchFilterDto,
    options?: { page?: number; limit?: number; sort?: Array<{ field: string; order: 'ASC' | 'DESC' }> },
  ): Promise<{ data: Branch[]; total: number; page: number; limit: number }> {
    const cacheKey = `branch:filter:${JSON.stringify({ filterDto, options })}`;
    const cached = await this.cacheManager.get<{ data: Branch[]; total: number; page: number; limit: number }>(cacheKey);
    
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
   * Count branchs
   */
  async count(): Promise<number> {
    const cacheKey = 'branch:count';
    const cached = await this.cacheManager.get<number>(cacheKey);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const count = await this.repository.count();
    await this.cacheManager.set(cacheKey, count, 300);
    
    return count;
  }

  /**
   * Check if branch exists
   */
  async exists(id: number): Promise<boolean> {
    const cacheKey = `branch:${id}:exists`;
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
    data: CreateBranchDto | UpdateBranchDto,
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
   * Invalidate all cache for branch
   */
  private async invalidateCache(): Promise<void> {
    // Invalidate common cache keys
    await this.cacheManager.del('branch:all');
    
    // Note: cache-manager v5 doesn't support listing all keys
    // For production, consider using a cache with pattern-based deletion
    // or maintain a list of cache keys in your application
  }

}
