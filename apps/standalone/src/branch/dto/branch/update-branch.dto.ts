import { IsString, IsOptional, IsEmail, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Update branch DTO
 * Auto-generated from metadata
 * All fields are optional for partial updates
 */

export class UpdateBranchDto {
  /**
   * Address
   */
  @ApiProperty({ description: 'Address', type: 'string', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  /**
   * Unique code for identification
   */
  @ApiProperty({ description: 'Unique code for identification', type: 'string', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  /**
   * Email
   */
  @ApiProperty({ description: 'Email', type: 'string', required: false })
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  /**
   * No
   */
  @ApiProperty({ description: 'No', type: 'number', required: false })
  @IsNumber()
  @IsOptional()
  no?: number;

  /**
   * Region Code
   */
  @ApiProperty({ required: false, description: 'Region Code', type: 'string' })
  @IsOptional()
  @IsString()
  regionCode?: string;

  /**
   * Regional
   */
  @ApiProperty({ description: 'Regional', type: 'string', required: false })
  @IsString()
  @IsOptional()
  regional?: string;

  /**
   * Type
   */
  @ApiProperty({ description: 'Type', type: 'string', required: false })
  @IsString()
  @IsOptional()
  type?: string;
}
