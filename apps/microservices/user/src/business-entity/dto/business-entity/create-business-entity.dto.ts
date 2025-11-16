import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create business_entity DTO
 * Auto-generated from metadata
 */

export class CreateBusinessEntityDto {
  /**
   * Unique code for identification
   */
  @ApiProperty({ description: 'Unique code for identification', type: 'string', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  /**
   * Detailed description
   */
  @ApiProperty({ description: 'Detailed description', type: 'string', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Name or title
   */
  @ApiProperty({ description: 'Name or title', type: 'string' })
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Prefix
   */
  @ApiProperty({ description: 'Prefix', type: 'string', required: false })
  @IsString()
  @IsOptional()
  prefix?: string;

  /**
   * Record status (active/inactive)
   */
  @ApiProperty({ description: 'Record status (active/inactive)', example: 'active', type: 'string', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  /**
   * Suffix
   */
  @ApiProperty({ description: 'Suffix', type: 'string', required: false })
  @IsString()
  @IsOptional()
  suffix?: string;
}
