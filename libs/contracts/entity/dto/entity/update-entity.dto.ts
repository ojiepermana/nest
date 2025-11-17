import { IsString, IsOptional, IsDate, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Update entity DTO
 * Auto-generated from metadata
 * All fields are optional for partial updates
 */

export class UpdateEntityDto {
  /**
   * Address
   */
  @IsString()
  @IsOptional()
  address?: string;

  /**
   * Avatar Doc Id
   */
  @IsString()
  @IsOptional()
  avatarDocId?: string;

  /**
   * Birth Date
   */
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  birthDate?: Date;

  /**
   * Brand
   */
  @IsString()
  @IsOptional()
  brand?: string;

  /**
   * Business Entity Id
   */
  @IsOptional()
  @IsString()
  businessEntityId?: string;

  /**
   * Unique code for identification
   */
  @IsOptional()
  @IsString()
  code?: string;

  /**
   * Email
   */
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  /**
   * Local Phone
   */
  @IsString()
  @IsOptional()
  localPhone?: string;

  /**
   * Name or title
   */
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * Postcode
   */
  @IsString()
  @IsOptional()
  postcode?: string;

  /**
   * Region Code
   */
  @IsOptional()
  @IsString()
  regionCode?: string;

  /**
   * Record status (active/inactive)
   */
  @IsString()
  @IsOptional()
  status?: string;

  /**
   * Type
   */
  @IsString()
  @IsOptional()
  type?: string;
}
