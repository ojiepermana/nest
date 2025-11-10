import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { Users } from '../entities/users.entity';
import { CreateUsersDto } from '../dto/create-users.dto';
import { UpdateUsersDto } from '../dto/update-users.dto';
import { UsersFilterDto } from '../dto/users-filter.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
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
  async findOne(id: string): Promise<Users> {
    const users = await this.repository.findOne(id);
    
    return users;
  }

  /**
   * Update a users
   */
  async update(id: string, updateDto: UpdateUsersDto): Promise<Users> {
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
  async remove(id: string): Promise<void> {
    // Validate exists
    await this.findOne(id);

    await this.repository.delete(id);
  }


  /**
   * Find userss with filters
   */
  async findWithFilters(
    filterDto: UsersFilterDto,
    options?: { page?: number; limit?: number; sort?: Array<{ field: string; order: 'ASC' | 'DESC' }> },
  ): Promise<{ data: Users[]; total: number; page: number; limit: number }> {
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
    excludeId?: string,
  ): Promise<void> {
    // Add custom validation logic here based on unique columns
    // Example: Check if email already exists
    // No unique constraints defined
  }

}
