import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { Users } from '../entities/users.entity';
import { CreateUsersDto } from '../dto/create-users.dto';
import { UpdateUsersDto } from '../dto/update-users.dto';
import { UsersFilterDto } from '../dto/users-filter.dto';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly dataSource: DataSource,
  ) {}


  /**
   * Create a new users
   */
  async create(createDto: CreateUsersDto): Promise<Users> {
    // Validate unique constraints
    await this.validateUniqueConstraints(createDto);

    const users = await this.repository.create(createDto);
    
    return users;
  }

  /**
   * Find all userss
   */
  async findAll(): Promise<Users[]> {
    return this.repository.findAll();
  }

  /**
   * Find one users by ID
   */
  async findOne(id: number): Promise<Users> {
    const users = await this.repository.findOne(id);
    
    return users;
  }

  /**
   * Update a users
   */
  async update(id: number, updateDto: UpdateUsersDto): Promise<Users> {
    // Validate exists
    await this.findOne(id);
    
    // Validate unique constraints
    await this.validateUniqueConstraints(updateDto, id);

    const users = await this.repository.update(id, updateDto);
    
    return users;
  }

  /**
   * Remove a users
   */
  async remove(id: number): Promise<void> {
    // Validate exists
    await this.findOne(id);

    await this.repository.remove(id);
  }


  /**
   * Find userss with filters
   */
  async findWithFilters(
    filterDto: UsersFilterDto,
    options?: { page?: number; limit?: number; sort?: Array<{ field: string; order: 'ASC' | 'DESC' }> },
  ): Promise<{ data: Users[]; total: number; page: number; limit: number }> {
    const result = await this.repository.findWithFilters(filterDto, options);
    
    return result;
  }


  /**
   * Count userss
   */
  async count(): Promise<number> {
    return this.repository.count();
  }

  /**
   * Check if users exists
   */
  async exists(id: number): Promise<boolean> {
    return this.repository.exists({ id } as any);
  }

  /**
   * Validate unique constraints
   */
  private async validateUniqueConstraints(
    data: CreateUsersDto | UpdateUsersDto,
    excludeId?: number,
  ): Promise<void> {
    // Add custom validation logic here based on unique columns
    // Example: Check if email already exists
    // No unique constraints defined
  }

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

}
