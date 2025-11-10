import { IsOptional, IsString, IsArray, ArrayMinSize, ArrayMaxSize, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Filter users DTO
 * Auto-generated from metadata
 * Supports query operators: _eq, _ne, _gt, _gte, _lt, _lte, _like, _in, _between, _null
 */

export class FilterUsersDto {
  /**
   * Primary key (Equal to)
   */
  @ApiProperty({ description: 'Primary key (Equal to)', required: false, type: 'string' })
  @IsOptional()
  id_eq?: string;

  /**
   * Primary key (Not equal to)
   */
  @ApiProperty({ description: 'Primary key (Not equal to)', required: false, type: 'string' })
  @IsOptional()
  id_ne?: string;

  /**
   * Primary key (Greater than)
   */
  @ApiProperty({ description: 'Primary key (Greater than)', required: false, type: 'string' })
  @IsOptional()
  id_gt?: string;

  /**
   * Primary key (Greater than or equal)
   */
  @ApiProperty({ description: 'Primary key (Greater than or equal)', required: false, type: 'string' })
  @IsOptional()
  id_gte?: string;

  /**
   * Primary key (Less than)
   */
  @ApiProperty({ description: 'Primary key (Less than)', required: false, type: 'string' })
  @IsOptional()
  id_lt?: string;

  /**
   * Primary key (Less than or equal)
   */
  @ApiProperty({ description: 'Primary key (Less than or equal)', required: false, type: 'string' })
  @IsOptional()
  id_lte?: string;

  /**
   * Primary key (Pattern match)
   */
  @ApiProperty({ description: 'Primary key (Pattern match)', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  id_like?: string;

  /**
   * Primary key (In array)
   */
  @ApiProperty({ description: 'Primary key (In array)', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  id_in?: string[];

  /**
   * Primary key (Between two values)
   */
  @ApiProperty({ description: 'Primary key (Between two values)', required: false, type: 'array' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  id_between?: [string, string];

  /**
   * Primary key (Is null/not null)
   */
  @ApiProperty({ description: 'Primary key (Is null/not null)', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  id_null?: boolean;

  /**
   * Unique username (Equal to)
   */
  @ApiProperty({ description: 'Unique username (Equal to)', required: false, type: 'string' })
  @IsOptional()
  username_eq?: string;

  /**
   * Unique username (Not equal to)
   */
  @ApiProperty({ description: 'Unique username (Not equal to)', required: false, type: 'string' })
  @IsOptional()
  username_ne?: string;

  /**
   * Unique username (Greater than)
   */
  @ApiProperty({ description: 'Unique username (Greater than)', required: false, type: 'string' })
  @IsOptional()
  username_gt?: string;

  /**
   * Unique username (Greater than or equal)
   */
  @ApiProperty({ description: 'Unique username (Greater than or equal)', required: false, type: 'string' })
  @IsOptional()
  username_gte?: string;

  /**
   * Unique username (Less than)
   */
  @ApiProperty({ description: 'Unique username (Less than)', required: false, type: 'string' })
  @IsOptional()
  username_lt?: string;

  /**
   * Unique username (Less than or equal)
   */
  @ApiProperty({ description: 'Unique username (Less than or equal)', required: false, type: 'string' })
  @IsOptional()
  username_lte?: string;

  /**
   * Unique username (Pattern match)
   */
  @ApiProperty({ description: 'Unique username (Pattern match)', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  username_like?: string;

  /**
   * Unique username (In array)
   */
  @ApiProperty({ description: 'Unique username (In array)', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  username_in?: string[];

  /**
   * Unique username (Between two values)
   */
  @ApiProperty({ description: 'Unique username (Between two values)', required: false, type: 'array' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  username_between?: [string, string];

  /**
   * Unique username (Is null/not null)
   */
  @ApiProperty({ description: 'Unique username (Is null/not null)', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  username_null?: boolean;

  /**
   * User email address (Equal to)
   */
  @ApiProperty({ description: 'User email address (Equal to)', required: false, type: 'string' })
  @IsOptional()
  email_eq?: string;

  /**
   * User email address (Not equal to)
   */
  @ApiProperty({ description: 'User email address (Not equal to)', required: false, type: 'string' })
  @IsOptional()
  email_ne?: string;

  /**
   * User email address (Greater than)
   */
  @ApiProperty({ description: 'User email address (Greater than)', required: false, type: 'string' })
  @IsOptional()
  email_gt?: string;

  /**
   * User email address (Greater than or equal)
   */
  @ApiProperty({ description: 'User email address (Greater than or equal)', required: false, type: 'string' })
  @IsOptional()
  email_gte?: string;

  /**
   * User email address (Less than)
   */
  @ApiProperty({ description: 'User email address (Less than)', required: false, type: 'string' })
  @IsOptional()
  email_lt?: string;

  /**
   * User email address (Less than or equal)
   */
  @ApiProperty({ description: 'User email address (Less than or equal)', required: false, type: 'string' })
  @IsOptional()
  email_lte?: string;

  /**
   * User email address (Pattern match)
   */
  @ApiProperty({ description: 'User email address (Pattern match)', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  email_like?: string;

  /**
   * User email address (In array)
   */
  @ApiProperty({ description: 'User email address (In array)', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  email_in?: string[];

  /**
   * User email address (Between two values)
   */
  @ApiProperty({ description: 'User email address (Between two values)', required: false, type: 'array' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  email_between?: [string, string];

  /**
   * User email address (Is null/not null)
   */
  @ApiProperty({ description: 'User email address (Is null/not null)', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  email_null?: boolean;

  /**
   * Hashed password (Equal to)
   */
  @ApiProperty({ description: 'Hashed password (Equal to)', required: false, type: 'string' })
  @IsOptional()
  passwordHash_eq?: string;

  /**
   * Hashed password (Not equal to)
   */
  @ApiProperty({ description: 'Hashed password (Not equal to)', required: false, type: 'string' })
  @IsOptional()
  passwordHash_ne?: string;

  /**
   * Hashed password (Greater than)
   */
  @ApiProperty({ description: 'Hashed password (Greater than)', required: false, type: 'string' })
  @IsOptional()
  passwordHash_gt?: string;

  /**
   * Hashed password (Greater than or equal)
   */
  @ApiProperty({ description: 'Hashed password (Greater than or equal)', required: false, type: 'string' })
  @IsOptional()
  passwordHash_gte?: string;

  /**
   * Hashed password (Less than)
   */
  @ApiProperty({ description: 'Hashed password (Less than)', required: false, type: 'string' })
  @IsOptional()
  passwordHash_lt?: string;

  /**
   * Hashed password (Less than or equal)
   */
  @ApiProperty({ description: 'Hashed password (Less than or equal)', required: false, type: 'string' })
  @IsOptional()
  passwordHash_lte?: string;

  /**
   * Hashed password (Pattern match)
   */
  @ApiProperty({ description: 'Hashed password (Pattern match)', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  passwordHash_like?: string;

  /**
   * Hashed password (In array)
   */
  @ApiProperty({ description: 'Hashed password (In array)', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  passwordHash_in?: string[];

  /**
   * Hashed password (Between two values)
   */
  @ApiProperty({ description: 'Hashed password (Between two values)', required: false, type: 'array' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  passwordHash_between?: [string, string];

  /**
   * Hashed password (Is null/not null)
   */
  @ApiProperty({ description: 'Hashed password (Is null/not null)', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  passwordHash_null?: boolean;

  /**
   * Full name of user (Equal to)
   */
  @ApiProperty({ description: 'Full name of user (Equal to)', required: false, type: 'string' })
  @IsOptional()
  fullName_eq?: string;

  /**
   * Full name of user (Not equal to)
   */
  @ApiProperty({ description: 'Full name of user (Not equal to)', required: false, type: 'string' })
  @IsOptional()
  fullName_ne?: string;

  /**
   * Full name of user (Greater than)
   */
  @ApiProperty({ description: 'Full name of user (Greater than)', required: false, type: 'string' })
  @IsOptional()
  fullName_gt?: string;

  /**
   * Full name of user (Greater than or equal)
   */
  @ApiProperty({ description: 'Full name of user (Greater than or equal)', required: false, type: 'string' })
  @IsOptional()
  fullName_gte?: string;

  /**
   * Full name of user (Less than)
   */
  @ApiProperty({ description: 'Full name of user (Less than)', required: false, type: 'string' })
  @IsOptional()
  fullName_lt?: string;

  /**
   * Full name of user (Less than or equal)
   */
  @ApiProperty({ description: 'Full name of user (Less than or equal)', required: false, type: 'string' })
  @IsOptional()
  fullName_lte?: string;

  /**
   * Full name of user (Pattern match)
   */
  @ApiProperty({ description: 'Full name of user (Pattern match)', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  fullName_like?: string;

  /**
   * Full name of user (In array)
   */
  @ApiProperty({ description: 'Full name of user (In array)', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  fullName_in?: string[];

  /**
   * Full name of user (Between two values)
   */
  @ApiProperty({ description: 'Full name of user (Between two values)', required: false, type: 'array' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  fullName_between?: [string, string];

  /**
   * Full name of user (Is null/not null)
   */
  @ApiProperty({ description: 'Full name of user (Is null/not null)', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  fullName_null?: boolean;

  /**
   * Account active status (Equal to)
   */
  @ApiProperty({ description: 'Account active status (Equal to)', required: false, type: 'boolean' })
  @IsOptional()
  isActive_eq?: boolean;

  /**
   * Account active status (Not equal to)
   */
  @ApiProperty({ description: 'Account active status (Not equal to)', required: false, type: 'boolean' })
  @IsOptional()
  isActive_ne?: boolean;

  /**
   * Account active status (Greater than)
   */
  @ApiProperty({ description: 'Account active status (Greater than)', required: false, type: 'boolean' })
  @IsOptional()
  isActive_gt?: boolean;

  /**
   * Account active status (Greater than or equal)
   */
  @ApiProperty({ description: 'Account active status (Greater than or equal)', required: false, type: 'boolean' })
  @IsOptional()
  isActive_gte?: boolean;

  /**
   * Account active status (Less than)
   */
  @ApiProperty({ description: 'Account active status (Less than)', required: false, type: 'boolean' })
  @IsOptional()
  isActive_lt?: boolean;

  /**
   * Account active status (Less than or equal)
   */
  @ApiProperty({ description: 'Account active status (Less than or equal)', required: false, type: 'boolean' })
  @IsOptional()
  isActive_lte?: boolean;

  /**
   * Account active status (Pattern match)
   */
  @ApiProperty({ description: 'Account active status (Pattern match)', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  isActive_like?: string;

  /**
   * Account active status (In array)
   */
  @ApiProperty({ description: 'Account active status (In array)', required: false, type: [Boolean] })
  @IsOptional()
  @IsArray()
  isActive_in?: boolean[];

  /**
   * Account active status (Between two values)
   */
  @ApiProperty({ description: 'Account active status (Between two values)', required: false, type: 'array' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  isActive_between?: [boolean, boolean];

  /**
   * Account active status (Is null/not null)
   */
  @ApiProperty({ description: 'Account active status (Is null/not null)', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  isActive_null?: boolean;

  /**
   * Creation timestamp (Equal to)
   */
  @ApiProperty({ description: 'Creation timestamp (Equal to)', required: false, type: Date })
  @IsOptional()
  createdAt_eq?: Date;

  /**
   * Creation timestamp (Not equal to)
   */
  @ApiProperty({ description: 'Creation timestamp (Not equal to)', required: false, type: Date })
  @IsOptional()
  createdAt_ne?: Date;

  /**
   * Creation timestamp (Greater than)
   */
  @ApiProperty({ description: 'Creation timestamp (Greater than)', required: false, type: Date })
  @IsOptional()
  createdAt_gt?: Date;

  /**
   * Creation timestamp (Greater than or equal)
   */
  @ApiProperty({ description: 'Creation timestamp (Greater than or equal)', required: false, type: Date })
  @IsOptional()
  createdAt_gte?: Date;

  /**
   * Creation timestamp (Less than)
   */
  @ApiProperty({ description: 'Creation timestamp (Less than)', required: false, type: Date })
  @IsOptional()
  createdAt_lt?: Date;

  /**
   * Creation timestamp (Less than or equal)
   */
  @ApiProperty({ description: 'Creation timestamp (Less than or equal)', required: false, type: Date })
  @IsOptional()
  createdAt_lte?: Date;

  /**
   * Creation timestamp (Pattern match)
   */
  @ApiProperty({ description: 'Creation timestamp (Pattern match)', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  createdAt_like?: string;

  /**
   * Creation timestamp (In array)
   */
  @ApiProperty({ description: 'Creation timestamp (In array)', required: false, type: [Date] })
  @IsOptional()
  @IsArray()
  createdAt_in?: Date[];

  /**
   * Creation timestamp (Between two values)
   */
  @ApiProperty({ description: 'Creation timestamp (Between two values)', required: false, type: 'array' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  createdAt_between?: [Date, Date];

  /**
   * Creation timestamp (Is null/not null)
   */
  @ApiProperty({ description: 'Creation timestamp (Is null/not null)', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  createdAt_null?: boolean;

  /**
   * Last update timestamp (Equal to)
   */
  @ApiProperty({ description: 'Last update timestamp (Equal to)', required: false, type: Date })
  @IsOptional()
  updatedAt_eq?: Date;

  /**
   * Last update timestamp (Not equal to)
   */
  @ApiProperty({ description: 'Last update timestamp (Not equal to)', required: false, type: Date })
  @IsOptional()
  updatedAt_ne?: Date;

  /**
   * Last update timestamp (Greater than)
   */
  @ApiProperty({ description: 'Last update timestamp (Greater than)', required: false, type: Date })
  @IsOptional()
  updatedAt_gt?: Date;

  /**
   * Last update timestamp (Greater than or equal)
   */
  @ApiProperty({ description: 'Last update timestamp (Greater than or equal)', required: false, type: Date })
  @IsOptional()
  updatedAt_gte?: Date;

  /**
   * Last update timestamp (Less than)
   */
  @ApiProperty({ description: 'Last update timestamp (Less than)', required: false, type: Date })
  @IsOptional()
  updatedAt_lt?: Date;

  /**
   * Last update timestamp (Less than or equal)
   */
  @ApiProperty({ description: 'Last update timestamp (Less than or equal)', required: false, type: Date })
  @IsOptional()
  updatedAt_lte?: Date;

  /**
   * Last update timestamp (Pattern match)
   */
  @ApiProperty({ description: 'Last update timestamp (Pattern match)', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  updatedAt_like?: string;

  /**
   * Last update timestamp (In array)
   */
  @ApiProperty({ description: 'Last update timestamp (In array)', required: false, type: [Date] })
  @IsOptional()
  @IsArray()
  updatedAt_in?: Date[];

  /**
   * Last update timestamp (Between two values)
   */
  @ApiProperty({ description: 'Last update timestamp (Between two values)', required: false, type: 'array' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  updatedAt_between?: [Date, Date];

  /**
   * Last update timestamp (Is null/not null)
   */
  @ApiProperty({ description: 'Last update timestamp (Is null/not null)', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  updatedAt_null?: boolean;

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
}

// Export alias for compatibility
export { FilterUsersDto as UsersFilterDto };
