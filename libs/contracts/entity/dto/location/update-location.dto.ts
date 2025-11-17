import { IsOptional, IsString, IsNumber } from 'class-validator';

/**
 * Update location DTO
 * Auto-generated from metadata
 * All fields are optional for partial updates
 */

export class UpdateLocationDto {
  /**
   * Branch Id
   */
  @IsOptional()
  @IsString()
  branchId?: string;

  /**
   * Building Area
   */
  @IsNumber()
  @IsOptional()
  buildingArea?: number;

  /**
   * Entity Id
   */
  @IsOptional()
  @IsString()
  entityId?: string;

  /**
   * Location Type Id
   */
  @IsOptional()
  @IsString()
  locationTypeId?: string;

  /**
   * Nitku
   */
  @IsString()
  @IsOptional()
  nitku?: string;

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
   * Surface Area
   */
  @IsNumber()
  @IsOptional()
  surfaceArea?: number;
}
