import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create users DTO
 * Auto-generated from metadata
 */

export class CreateUsersDto {
  /**
   * Unique username
   */
  @ApiProperty({ description: 'Unique username', type: 'string', required: false })
  @IsString()
  @IsOptional()
  username?: string;

  /**
   * User email address
   */
  @ApiProperty({ description: 'User email address', type: 'string', required: false })
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  /**
   * Hashed password
   */
  @ApiProperty({ description: 'Hashed password', type: 'string', required: false })
  @IsString()
  @IsOptional()
  passwordHash?: string;

  /**
   * Full name of user
   */
  @ApiProperty({ description: 'Full name of user', type: 'string', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  /**
   * Account active status
   */
  @ApiProperty({ description: 'Account active status', type: 'boolean', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
