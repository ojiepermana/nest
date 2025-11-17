import { IsString, IsOptional, IsDate, IsNotEmpty, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Create entity DTO
 * Auto-generated from metadata
 */

export class CreateEntityDto {
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
  @IsNotEmpty()
  @IsString()
  businessEntityId: string;

  /**
   * Unique code for identification
   */
  @IsNotEmpty()
  @IsString()
  code: string;

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
  @IsNotEmpty()
  @IsString()
  regionCode: string;

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
