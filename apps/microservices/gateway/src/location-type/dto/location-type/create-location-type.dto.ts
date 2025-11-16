import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create location_type DTO
 * Auto-generated from metadata
 */

export class CreateLocationTypeDto {
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
  @ApiProperty({ description: 'Name or title', type: 'string', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * Record status (active/inactive)
   */
  @ApiProperty({ description: 'Record status (active/inactive)', example: 'active', type: 'string', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}
