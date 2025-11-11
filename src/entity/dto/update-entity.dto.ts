import { IsString, IsOptional, IsDate, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Update entity DTO
 * Auto-generated from metadata
 * All fields are optional for partial updates
 */

export class UpdateEntityDto {
  /**
   * Address
   */
  @ApiProperty({ description: 'Address', type: 'string', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  /**
   * Avatar Doc Id
   */
  @ApiProperty({ description: 'Avatar Doc Id', type: 'string', required: false })
  @IsString()
  @IsOptional()
  avatarDocId?: string;

  /**
   * Birth Date
   */
  @ApiProperty({ description: 'Birth Date', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  birthDate?: Date;

  /**
   * Brand
   */
  @ApiProperty({ description: 'Brand', type: 'string', required: false })
  @IsString()
  @IsOptional()
  brand?: string;

  /**
   * Business Entity Id
   */
  @ApiProperty({ required: false, description: 'Business Entity Id', type: 'string' })
  @IsOptional()
  @IsString()
  businessEntityId?: string;

  /**
   * Unique code for identification
   */
  @ApiProperty({ required: false, description: 'Unique code for identification', type: 'string' })
  @IsOptional()
  @IsString()
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
   * Local Phone
   */
  @ApiProperty({ description: 'Local Phone', type: 'string', required: false })
  @IsString()
  @IsOptional()
  localPhone?: string;

  /**
   * Name or title
   */
  @ApiProperty({ description: 'Name or title', type: 'string', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * Postcode
   */
  @ApiProperty({ description: 'Postcode', type: 'string', required: false })
  @IsString()
  @IsOptional()
  postcode?: string;

  /**
   * Region Code
   */
  @ApiProperty({ required: false, description: 'Region Code', type: 'string' })
  @IsOptional()
  @IsString()
  regionCode?: string;

  /**
   * Record status (active/inactive)
   */
  @ApiProperty({ description: 'Record status (active/inactive)', example: active, type: 'string', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  /**
   * Type
   */
  @ApiProperty({ description: 'Type', type: 'string', required: false })
  @IsString()
  @IsOptional()
  type?: string;
}
