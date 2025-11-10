import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial } from 'typeorm';
import { Users } from '../entities/users.entity';
import { UsersFilterDto } from '../dto/users-filter.dto';
import { CreateUsersDto } from '../dto/create-users.dto';
import { UpdateUsersDto } from '../dto/update-users.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(Users)
    private readonly repository: Repository<Users>,
  ) {}

  /**
   * Create a new users
   */
  async create(createDto: CreateUsersDto): Promise<Users> {
    const users = this.repository.create(createDto as DeepPartial<Users>);
    return this.repository.save(users);
  }

  /**
   * Find all userss
   */
  async findAll(options?: FindManyOptions<Users>): Promise<Users[]> {
    return this.repository.find(options);
  }

  /**
   * Find one users by ID
   */
  async findOne(id: number): Promise<Users | null> {
    return this.repository.findOne({ where: { undefined: id } as FindOptionsWhere<Users> });
  }

  /**
   * Find one users by conditions
   */
  async findOneBy(where: FindOptionsWhere<Users>): Promise<Users | null> {
    return this.repository.findOne({ where });
  }

  /**
   * Update a users
   */
  async update(id: number, updateDto: UpdateUsersDto): Promise<Users> {
    const users = await this.findOne(id);
    if (!users) {
      throw new Error('Users not found');
    }
    Object.assign(users, updateDto);
    return this.repository.save(users);
  }

  /**
   * Delete a users
   */
  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Count userss
   */
  async count(where?: FindOptionsWhere<Users>): Promise<number> {
    return this.repository.count({ where });
  }

  /**
   * Check if users exists
   */
  async exists(where: FindOptionsWhere<Users>): Promise<boolean> {
    const count = await this.repository.count({ where });
    return count > 0;
  }

  /**
   * Find userss with filters
   */
  async findWithFilters(
    filterDto: UsersFilterDto,
    options?: {
      page?: number;
      limit?: number;
      sort?: Array<{ field: string; order: 'ASC' | 'DESC' }>;
    },
  ): Promise<{ data: Users[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.repository.createQueryBuilder('users');

    // Apply filters
    Object.keys(filterDto).forEach((key) => {
      const value = filterDto[key as keyof UsersFilterDto];
      if (value === undefined || value === null) {
        return;
      }

      // Parse operator suffix
      const operatorMatch = key.match(/^(.+)_(eq|ne|gt|gte|lt|lte|like|in|between|null)$/);

      if (operatorMatch) {
        const [, field, operator] = operatorMatch;
        this.applyFilter(queryBuilder, field, operator, value);
      } else {
        // Default to equality
        queryBuilder.andWhere(`users.${key} = :value_${key}`, { [`value_${key}`]: value });
      }
    });

    // Apply sorting
    if (options?.sort && options.sort.length > 0) {
      options.sort.forEach((sortOption, index) => {
        if (index === 0) {
          queryBuilder.orderBy(`users.${sortOption.field}`, sortOption.order);
        } else {
          queryBuilder.addOrderBy(`users.${sortOption.field}`, sortOption.order);
        }
      });
    }

    // Count total
    const total = await queryBuilder.getCount();

    // Apply pagination
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    queryBuilder.skip((page - 1) * limit).take(limit);

    const data = await queryBuilder.getMany();

    return { data, total, page, limit };
  }

  /**
   * Apply filter to query builder
   */
  private applyFilter(queryBuilder: any, field: string, operator: string, value: any): void {
    const camelName = 'users';
    const paramKey = `filter_${field}_${operator}`;

    switch (operator) {
      case 'eq':
        queryBuilder.andWhere(`${camelName}.${field} = :${paramKey}`, { [paramKey]: value });
        break;
      case 'ne':
        queryBuilder.andWhere(`${camelName}.${field} != :${paramKey}`, { [paramKey]: value });
        break;
      case 'gt':
        queryBuilder.andWhere(`${camelName}.${field} > :${paramKey}`, { [paramKey]: value });
        break;
      case 'gte':
        queryBuilder.andWhere(`${camelName}.${field} >= :${paramKey}`, { [paramKey]: value });
        break;
      case 'lt':
        queryBuilder.andWhere(`${camelName}.${field} < :${paramKey}`, { [paramKey]: value });
        break;
      case 'lte':
        queryBuilder.andWhere(`${camelName}.${field} <= :${paramKey}`, { [paramKey]: value });
        break;
      case 'like':
        queryBuilder.andWhere(`${camelName}.${field} LIKE :${paramKey}`, {
          [paramKey]: `%${value}%`,
        });
        break;
      case 'in':
        if (Array.isArray(value) && value.length > 0) {
          queryBuilder.andWhere(`${camelName}.${field} IN (:${paramKey})`, { [paramKey]: value });
        }
        break;
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          queryBuilder.andWhere(
            `${camelName}.${field} BETWEEN :${paramKey}_start AND :${paramKey}_end`,
            {
              [`${paramKey}_start`]: value[0],
              [`${paramKey}_end`]: value[1],
            },
          );
        }
        break;
      case 'null':
        if (value === true) {
          queryBuilder.andWhere(`${camelName}.${field} IS NULL`);
        } else if (value === false) {
          queryBuilder.andWhere(`${camelName}.${field} IS NOT NULL`);
        }
        break;
    }
  }
}
