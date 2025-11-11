import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Update location DTO
 * Auto-generated from metadata
 * All fields are optional for partial updates
 */

export class UpdateLocationDto {
  /**
   * Branch Id
   */
  @ApiProperty({ required: false, description: 'Branch Id', type: 'string' })
  @IsOptional()
  @IsString()
  branchId?: string;

  /**
   * Building Area
   */
  @ApiProperty({ description: 'Building Area', type: 'number', required: false })
  @IsNumber()
  @IsOptional()
  buildingArea?: number;

  /**
   * Entity Id
   */
  @ApiProperty({ required: false, description: 'Entity Id', type: 'string' })
  @IsOptional()
  @IsString()
  entityId?: string;

  /**
   * Location Type Id
   */
  @ApiProperty({ required: false, description: 'Location Type Id', type: 'string' })
  @IsOptional()
  @IsString()
  locationTypeId?: string;

  /**
   * Nitku
   */
  @ApiProperty({ description: 'Nitku', type: 'string', required: false })
  @IsString()
  @IsOptional()
  nitku?: string;

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
   * Surface Area
   */
  @ApiProperty({ description: 'Surface Area', type: 'number', required: false })
  @IsNumber()
  @IsOptional()
  surfaceArea?: number;
}
