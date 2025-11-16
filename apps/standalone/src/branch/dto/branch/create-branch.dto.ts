import { IsString, IsOptional, IsEmail, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create branch DTO
 * Auto-generated from metadata
 */

export class CreateBranchDto {
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
  @ApiProperty({ description: 'Region Code', type: 'string' })
  @IsNotEmpty()
  @IsString()
  regionCode: string;

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
