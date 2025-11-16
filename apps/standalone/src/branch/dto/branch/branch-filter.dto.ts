import { IsOptional, IsString, IsArray, ArrayMinSize, ArrayMaxSize, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Filter branch DTO
 * Auto-generated from metadata
 * Supports query operators: _eq, _ne, _gt, _gte, _lt, _lte, _like, _in, _between, _null
 */

export class FilterBranchDto {
  /**
   * Unique code for identification (Equal to)
   */
  @ApiProperty({ description: 'Unique code for identification (Equal to)', required: false, type: 'string' })
  @IsOptional()
  code_eq?: string;

  /**
   * Unique code for identification (Not equal to)
   */
  @ApiProperty({ description: 'Unique code for identification (Not equal to)', required: false, type: 'string' })
  @IsOptional()
  code_ne?: string;

  /**
   * Unique code for identification (Greater than)
   */
  @ApiProperty({ description: 'Unique code for identification (Greater than)', required: false, type: 'string' })
  @IsOptional()
  code_gt?: string;

  /**
   * Unique code for identification (Greater than or equal)
   */
  @ApiProperty({ description: 'Unique code for identification (Greater than or equal)', required: false, type: 'string' })
  @IsOptional()
  code_gte?: string;

  /**
   * Unique code for identification (Less than)
   */
  @ApiProperty({ description: 'Unique code for identification (Less than)', required: false, type: 'string' })
  @IsOptional()
  code_lt?: string;

  /**
   * Unique code for identification (Less than or equal)
   */
  @ApiProperty({ description: 'Unique code for identification (Less than or equal)', required: false, type: 'string' })
  @IsOptional()
  code_lte?: string;

  /**
   * Unique code for identification (Pattern match)
   */
  @ApiProperty({ description: 'Unique code for identification (Pattern match)', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  code_like?: string;

  /**
   * Unique code for identification (In array)
   */
  @ApiProperty({ description: 'Unique code for identification (In array)', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  code_in?: string[];

  /**
   * Unique code for identification (Between two values)
   */
  @ApiProperty({ description: 'Unique code for identification (Between two values)', required: false, type: 'array' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  code_between?: [string, string];

  /**
   * Unique code for identification (Is null/not null)
   */
  @ApiProperty({ description: 'Unique code for identification (Is null/not null)', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  code_null?: boolean;

  /**
   * Record creation timestamp (Equal to)
   */
  @ApiProperty({ description: 'Record creation timestamp (Equal to)', required: false, type: Date })
  @IsOptional()
  createdAt_eq?: Date;

  /**
   * Record creation timestamp (Not equal to)
   */
  @ApiProperty({ description: 'Record creation timestamp (Not equal to)', required: false, type: Date })
  @IsOptional()
  createdAt_ne?: Date;

  /**
   * Record creation timestamp (Greater than)
   */
  @ApiProperty({ description: 'Record creation timestamp (Greater than)', required: false, type: Date })
  @IsOptional()
  createdAt_gt?: Date;

  /**
   * Record creation timestamp (Greater than or equal)
   */
  @ApiProperty({ description: 'Record creation timestamp (Greater than or equal)', required: false, type: Date })
  @IsOptional()
  createdAt_gte?: Date;

  /**
   * Record creation timestamp (Less than)
   */
  @ApiProperty({ description: 'Record creation timestamp (Less than)', required: false, type: Date })
  @IsOptional()
  createdAt_lt?: Date;

  /**
   * Record creation timestamp (Less than or equal)
   */
  @ApiProperty({ description: 'Record creation timestamp (Less than or equal)', required: false, type: Date })
  @IsOptional()
  createdAt_lte?: Date;

  /**
   * Record creation timestamp (Pattern match)
   */
  @ApiProperty({ description: 'Record creation timestamp (Pattern match)', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  createdAt_like?: string;

  /**
   * Record creation timestamp (In array)
   */
  @ApiProperty({ description: 'Record creation timestamp (In array)', required: false, type: [Date] })
  @IsOptional()
  @IsArray()
  createdAt_in?: Date[];

  /**
   * Record creation timestamp (Between two values)
   */
  @ApiProperty({ description: 'Record creation timestamp (Between two values)', required: false, type: 'array' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  createdAt_between?: [Date, Date];

  /**
   * Record creation timestamp (Is null/not null)
   */
  @ApiProperty({ description: 'Record creation timestamp (Is null/not null)', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  createdAt_null?: boolean;

  /**
   * Soft delete timestamp (Equal to)
   */
  @ApiProperty({ description: 'Soft delete timestamp (Equal to)', required: false, type: Date })
  @IsOptional()
  deletedAt_eq?: Date;

  /**
   * Soft delete timestamp (Not equal to)
   */
  @ApiProperty({ description: 'Soft delete timestamp (Not equal to)', required: false, type: Date })
  @IsOptional()
  deletedAt_ne?: Date;

  /**
   * Soft delete timestamp (Greater than)
   */
  @ApiProperty({ description: 'Soft delete timestamp (Greater than)', required: false, type: Date })
  @IsOptional()
  deletedAt_gt?: Date;

  /**
   * Soft delete timestamp (Greater than or equal)
   */
  @ApiProperty({ description: 'Soft delete timestamp (Greater than or equal)', required: false, type: Date })
  @IsOptional()
  deletedAt_gte?: Date;

  /**
   * Soft delete timestamp (Less than)
   */
  @ApiProperty({ description: 'Soft delete timestamp (Less than)', required: false, type: Date })
  @IsOptional()
  deletedAt_lt?: Date;

  /**
   * Soft delete timestamp (Less than or equal)
   */
  @ApiProperty({ description: 'Soft delete timestamp (Less than or equal)', required: false, type: Date })
  @IsOptional()
  deletedAt_lte?: Date;

  /**
   * Soft delete timestamp (Pattern match)
   */
  @ApiProperty({ description: 'Soft delete timestamp (Pattern match)', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  deletedAt_like?: string;

  /**
   * Soft delete timestamp (In array)
   */
  @ApiProperty({ description: 'Soft delete timestamp (In array)', required: false, type: [Date] })
  @IsOptional()
  @IsArray()
  deletedAt_in?: Date[];

  /**
   * Soft delete timestamp (Between two values)
   */
  @ApiProperty({ description: 'Soft delete timestamp (Between two values)', required: false, type: 'array' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  deletedAt_between?: [Date, Date];

  /**
   * Soft delete timestamp (Is null/not null)
   */
  @ApiProperty({ description: 'Soft delete timestamp (Is null/not null)', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  deletedAt_null?: boolean;

  /**
   * Primary key - unique identifier (Equal to)
   */
  @ApiProperty({ description: 'Primary key - unique identifier (Equal to)', required: false, type: 'string' })
  @IsOptional()
  id_eq?: string;

  /**
   * Primary key - unique identifier (Not equal to)
   */
  @ApiProperty({ description: 'Primary key - unique identifier (Not equal to)', required: false, type: 'string' })
  @IsOptional()
  id_ne?: string;

  /**
   * Primary key - unique identifier (Greater than)
   */
  @ApiProperty({ description: 'Primary key - unique identifier (Greater than)', required: false, type: 'string' })
  @IsOptional()
  id_gt?: string;

  /**
   * Primary key - unique identifier (Greater than or equal)
   */
  @ApiProperty({ description: 'Primary key - unique identifier (Greater than or equal)', required: false, type: 'string' })
  @IsOptional()
  id_gte?: string;

  /**
   * Primary key - unique identifier (Less than)
   */
  @ApiProperty({ description: 'Primary key - unique identifier (Less than)', required: false, type: 'string' })
  @IsOptional()
  id_lt?: string;

  /**
   * Primary key - unique identifier (Less than or equal)
   */
  @ApiProperty({ description: 'Primary key - unique identifier (Less than or equal)', required: false, type: 'string' })
  @IsOptional()
  id_lte?: string;

  /**
   * Primary key - unique identifier (Pattern match)
   */
  @ApiProperty({ description: 'Primary key - unique identifier (Pattern match)', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  id_like?: string;

  /**
   * Primary key - unique identifier (In array)
   */
  @ApiProperty({ description: 'Primary key - unique identifier (In array)', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  id_in?: string[];

  /**
   * Primary key - unique identifier (Between two values)
   */
  @ApiProperty({ description: 'Primary key - unique identifier (Between two values)', required: false, type: 'array' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  id_between?: [string, string];

  /**
   * Primary key - unique identifier (Is null/not null)
   */
  @ApiProperty({ description: 'Primary key - unique identifier (Is null/not null)', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  id_null?: boolean;

  /**
   * Last update timestamp (auto-updated) (Equal to)
   */
  @ApiProperty({ description: 'Last update timestamp (auto-updated) (Equal to)', required: false, type: Date })
  @IsOptional()
  updatedAt_eq?: Date;

  /**
   * Last update timestamp (auto-updated) (Not equal to)
   */
  @ApiProperty({ description: 'Last update timestamp (auto-updated) (Not equal to)', required: false, type: Date })
  @IsOptional()
  updatedAt_ne?: Date;

  /**
   * Last update timestamp (auto-updated) (Greater than)
   */
  @ApiProperty({ description: 'Last update timestamp (auto-updated) (Greater than)', required: false, type: Date })
  @IsOptional()
  updatedAt_gt?: Date;

  /**
   * Last update timestamp (auto-updated) (Greater than or equal)
   */
  @ApiProperty({ description: 'Last update timestamp (auto-updated) (Greater than or equal)', required: false, type: Date })
  @IsOptional()
  updatedAt_gte?: Date;

  /**
   * Last update timestamp (auto-updated) (Less than)
   */
  @ApiProperty({ description: 'Last update timestamp (auto-updated) (Less than)', required: false, type: Date })
  @IsOptional()
  updatedAt_lt?: Date;

  /**
   * Last update timestamp (auto-updated) (Less than or equal)
   */
  @ApiProperty({ description: 'Last update timestamp (auto-updated) (Less than or equal)', required: false, type: Date })
  @IsOptional()
  updatedAt_lte?: Date;

  /**
   * Last update timestamp (auto-updated) (Pattern match)
   */
  @ApiProperty({ description: 'Last update timestamp (auto-updated) (Pattern match)', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  updatedAt_like?: string;

  /**
   * Last update timestamp (auto-updated) (In array)
   */
  @ApiProperty({ description: 'Last update timestamp (auto-updated) (In array)', required: false, type: [Date] })
  @IsOptional()
  @IsArray()
  updatedAt_in?: Date[];

  /**
   * Last update timestamp (auto-updated) (Between two values)
   */
  @ApiProperty({ description: 'Last update timestamp (auto-updated) (Between two values)', required: false, type: 'array' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  updatedAt_between?: [Date, Date];

  /**
   * Last update timestamp (auto-updated) (Is null/not null)
   */
  @ApiProperty({ description: 'Last update timestamp (auto-updated) (Is null/not null)', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  updatedAt_null?: boolean;

  /**
   * Page number for pagination (default: 1)
   */
  @ApiProperty({
    description: 'Page number (default: 1)',
    required: false,
    type: 'number',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  /**
   * Number of items per page (default: 20, max: 100)
   */
  @ApiProperty({
    description: 'Items per page (default: 20, max: 100)',
    required: false,
    type: 'number',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /**
   * Sort field and order (e.g., 'name:ASC' or 'created_at:DESC,name:ASC')
   */
  @ApiProperty({
    description: 'Sort field and order (e.g., name:ASC or created_at:DESC,name:ASC)',
    required: false,
    type: 'string',
    example: 'created_at:DESC',
  })
  @IsOptional()
  @IsString()
  sort?: string;
}

// Export alias for compatibility
export { FilterBranchDto as BranchFilterDto };
