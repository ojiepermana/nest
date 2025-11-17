import { IsString, IsOptional } from 'class-validator';

/**
 * Update business_entity DTO
 * Auto-generated from metadata
 * All fields are optional for partial updates
 */

export class UpdateBusinessEntityDto {
  /**
   * Unique code for identification
   */
  @IsString()
  @IsOptional()
  code?: string;

  /**
   * Detailed description
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Name or title
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * Prefix
   */
  @IsString()
  @IsOptional()
  prefix?: string;

  /**
   * Record status (active/inactive)
   */
  @IsString()
  @IsOptional()
  status?: string;

  /**
   * Suffix
   */
  @IsString()
  @IsOptional()
  suffix?: string;
}
