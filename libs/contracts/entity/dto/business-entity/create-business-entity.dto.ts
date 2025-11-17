import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

/**
 * Create business_entity DTO
 * Auto-generated from metadata
 */

export class CreateBusinessEntityDto {
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
  @IsNotEmpty()
  @IsString()
  name: string;

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
