import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

/**
 * Create location DTO
 * Auto-generated from metadata
 */

export class CreateLocationDto {
  /**
   * Branch Id
   */
  @IsNotEmpty()
  @IsString()
  branchId: string;

  /**
   * Building Area
   */
  @IsNumber()
  @IsOptional()
  buildingArea?: number;

  /**
   * Entity Id
   */
  @IsNotEmpty()
  @IsString()
  entityId: string;

  /**
   * Location Type Id
   */
  @IsNotEmpty()
  @IsString()
  locationTypeId: string;

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
  @IsNotEmpty()
  @IsString()
  regionCode: string;

  /**
   * Surface Area
   */
  @IsNumber()
  @IsOptional()
  surfaceArea?: number;
}
