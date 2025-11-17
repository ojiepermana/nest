import { IsOptional, IsString, IsArray, ArrayMinSize, ArrayMaxSize, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Filter location DTO
 * Auto-generated from metadata
 * Supports query operators: _eq, _ne, _gt, _gte, _lt, _lte, _like, _in, _between, _null
 */

export class FilterLocationDto {
  /**
   * Record creation timestamp (Equal to)
   */
  @IsOptional()
  createdAt_eq?: Date;

  /**
   * Record creation timestamp (Not equal to)
   */
  @IsOptional()
  createdAt_ne?: Date;

  /**
   * Record creation timestamp (Greater than)
   */
  @IsOptional()
  createdAt_gt?: Date;

  /**
   * Record creation timestamp (Greater than or equal)
   */
  @IsOptional()
  createdAt_gte?: Date;

  /**
   * Record creation timestamp (Less than)
   */
  @IsOptional()
  createdAt_lt?: Date;

  /**
   * Record creation timestamp (Less than or equal)
   */
  @IsOptional()
  createdAt_lte?: Date;

  /**
   * Record creation timestamp (Pattern match)
   */
  @IsOptional()
  @IsString()
  createdAt_like?: string;

  /**
   * Record creation timestamp (In array)
   */
  @IsOptional()
  @IsArray()
  createdAt_in?: Date[];

  /**
   * Record creation timestamp (Between two values)
   */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  createdAt_between?: [Date, Date];

  /**
   * Record creation timestamp (Is null/not null)
   */
  @IsOptional()
  @IsBoolean()
  createdAt_null?: boolean;

  /**
   * Soft delete timestamp (Equal to)
   */
  @IsOptional()
  deletedAt_eq?: Date;

  /**
   * Soft delete timestamp (Not equal to)
   */
  @IsOptional()
  deletedAt_ne?: Date;

  /**
   * Soft delete timestamp (Greater than)
   */
  @IsOptional()
  deletedAt_gt?: Date;

  /**
   * Soft delete timestamp (Greater than or equal)
   */
  @IsOptional()
  deletedAt_gte?: Date;

  /**
   * Soft delete timestamp (Less than)
   */
  @IsOptional()
  deletedAt_lt?: Date;

  /**
   * Soft delete timestamp (Less than or equal)
   */
  @IsOptional()
  deletedAt_lte?: Date;

  /**
   * Soft delete timestamp (Pattern match)
   */
  @IsOptional()
  @IsString()
  deletedAt_like?: string;

  /**
   * Soft delete timestamp (In array)
   */
  @IsOptional()
  @IsArray()
  deletedAt_in?: Date[];

  /**
   * Soft delete timestamp (Between two values)
   */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  deletedAt_between?: [Date, Date];

  /**
   * Soft delete timestamp (Is null/not null)
   */
  @IsOptional()
  @IsBoolean()
  deletedAt_null?: boolean;

  /**
   * Primary key - unique identifier (Equal to)
   */
  @IsOptional()
  id_eq?: string;

  /**
   * Primary key - unique identifier (Not equal to)
   */
  @IsOptional()
  id_ne?: string;

  /**
   * Primary key - unique identifier (Greater than)
   */
  @IsOptional()
  id_gt?: string;

  /**
   * Primary key - unique identifier (Greater than or equal)
   */
  @IsOptional()
  id_gte?: string;

  /**
   * Primary key - unique identifier (Less than)
   */
  @IsOptional()
  id_lt?: string;

  /**
   * Primary key - unique identifier (Less than or equal)
   */
  @IsOptional()
  id_lte?: string;

  /**
   * Primary key - unique identifier (Pattern match)
   */
  @IsOptional()
  @IsString()
  id_like?: string;

  /**
   * Primary key - unique identifier (In array)
   */
  @IsOptional()
  @IsArray()
  id_in?: string[];

  /**
   * Primary key - unique identifier (Between two values)
   */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  id_between?: [string, string];

  /**
   * Primary key - unique identifier (Is null/not null)
   */
  @IsOptional()
  @IsBoolean()
  id_null?: boolean;

  /**
   * Last update timestamp (auto-updated) (Equal to)
   */
  @IsOptional()
  updatedAt_eq?: Date;

  /**
   * Last update timestamp (auto-updated) (Not equal to)
   */
  @IsOptional()
  updatedAt_ne?: Date;

  /**
   * Last update timestamp (auto-updated) (Greater than)
   */
  @IsOptional()
  updatedAt_gt?: Date;

  /**
   * Last update timestamp (auto-updated) (Greater than or equal)
   */
  @IsOptional()
  updatedAt_gte?: Date;

  /**
   * Last update timestamp (auto-updated) (Less than)
   */
  @IsOptional()
  updatedAt_lt?: Date;

  /**
   * Last update timestamp (auto-updated) (Less than or equal)
   */
  @IsOptional()
  updatedAt_lte?: Date;

  /**
   * Last update timestamp (auto-updated) (Pattern match)
   */
  @IsOptional()
  @IsString()
  updatedAt_like?: string;

  /**
   * Last update timestamp (auto-updated) (In array)
   */
  @IsOptional()
  @IsArray()
  updatedAt_in?: Date[];

  /**
   * Last update timestamp (auto-updated) (Between two values)
   */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  updatedAt_between?: [Date, Date];

  /**
   * Last update timestamp (auto-updated) (Is null/not null)
   */
  @IsOptional()
  @IsBoolean()
  updatedAt_null?: boolean;

  /**
   * Page number for pagination (default: 1)
   */
@IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  /**
   * Number of items per page (default: 20, max: 100)
   */
@IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /**
   * Sort field and order (e.g., 'name:ASC' or 'created_at:DESC,name:ASC')
   */
@IsOptional()
  @IsString()
  sort?: string;
}

// Export alias for compatibility
export { FilterLocationDto as LocationFilterDto };
