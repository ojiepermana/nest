import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { EntityRepository } from '../repositories/entity.repository';
import { Entity } from '../entities/entity.entity';
import { CreateEntityDto } from '../dto/create-entity.dto';
import { UpdateEntityDto } from '../dto/update-entity.dto';
import { EntityFilterDto } from '../dto/entity-filter.dto';
import { AuditLogService } from '@ojiepermana/nest-generator/audit';

@Injectable()
export class EntityService {
  constructor(
    private readonly repository: EntityRepository,
    private readonly auditLogService: AuditLogService,
  ) {}


  /**
   * Create a new entity
   */
  async create(createDto: CreateEntityDto): Promise<Entity> {
    // Validate unique constraints
    await this.validateUniqueConstraints(createDto);

    const entity = await this.repository.create(createDto);
    
    // Log audit
    await this.auditLogService.log({
      entity: 'Entity',
      entityId: entity.id,
      action: 'CREATE',
      data: createDto,
    });
    
    return entity;
  }

  /**
   * Find all entitys
   */
  async findAll(): Promise<Entity[]> {
    return this.repository.findAll();
  }

  /**
   * Find one entity by ID
   */
  async findOne(id: string): Promise<Entity> {
    const entity = await this.repository.findOne(id);
    
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
    
    // Log audit
    await this.auditLogService.log({
      entity: 'Entity',
      entityId: id,
      action: 'UPDATE',
      data: updateDto,
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
    
    // Log audit
    await this.auditLogService.log({
      entity: 'Entity',
      entityId: id,
      action: 'DELETE',
    });
  }


  /**
   * Find entitys with filters
   */
  async findWithFilters(
    filterDto: EntityFilterDto,
    options?: { page?: number; limit?: number; sort?: Array<{ field: string; order: 'ASC' | 'DESC' }> },
  ): Promise<{ data: Entity[]; total: number; page: number; limit: number }> {
    const data = await this.repository.findWithFilters(filterDto);
    const total = data.length;
    
    const result = {
      data,
      total,
      page: options?.page || 1,
      limit: options?.limit || 10,
    };
    
    return result;
  }


  /**
   * Count entitys
   */
  async count(): Promise<number> {
    return this.repository.count();
  }

  /**
   * Check if entity exists
   */
  async exists(id: number): Promise<boolean> {
    return this.repository.exists({ id } as any);
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
      const existing = await this.repository.findOneBy({ id: data.id } as any);
      if (existing && (!excludeId || existing.id !== excludeId)) {
        throw new ConflictException('id already exists');
      }
    }
  }

}
