import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EntityRepository } from '../repositories/entity.repository';
import { Entity } from '../entities/entity.entity';
import { CreateEntityDto } from '../dto/create-entity.dto';
import { UpdateEntityDto } from '../dto/update-entity.dto';
import { EntityFilterDto } from '../dto/entity-filter.dto';

@Injectable()
export class EntityService {
  constructor(private readonly repository: EntityRepository) {}

  /**
   * Create a new entity
   */
  async create(createDto: CreateEntityDto): Promise<Entity> {
    // Validate unique constraints
    await this.validateUniqueConstraints(createDto);

    const entity = await this.repository.create(createDto);

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

    return entity;
  }

  /**
   * Remove a entity
   */
  async remove(id: string): Promise<void> {
    // Validate exists
    await this.findOne(id);

    await this.repository.delete(id);
  }

  /**
   * Find entitys with filters
   */
  async findWithFilters(
    filterDto: EntityFilterDto,
    options?: {
      page?: number;
      limit?: number;
      sort?: Array<{ field: string; order: 'ASC' | 'DESC' }>;
    },
  ): Promise<{ data: Entity[]; total: number; page: number; limit: number }> {
    const { data, total } = await this.repository.findWithFilters(filterDto, options);

    const result = {
      data,
      total,
      page: options?.page || 1,
      limit: options?.limit || 20,
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
      const existing = await this.repository.findOne(data.id as string);
      if (existing && (!excludeId || existing.id !== excludeId)) {
        throw new ConflictException('id already exists');
      }
    }
  }
}
