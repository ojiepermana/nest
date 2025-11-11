import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create location DTO
 * Auto-generated from metadata
 */

export class CreateLocationDto {
  /**
   * Branch Id
   */
  @ApiProperty({ description: 'Branch Id', type: 'string' })
  @IsNotEmpty()
  @IsString()
  branchId: string;

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
  @ApiProperty({ description: 'Entity Id', type: 'string' })
  @IsNotEmpty()
  @IsString()
  entityId: string;

  /**
   * Location Type Id
   */
  @ApiProperty({ description: 'Location Type Id', type: 'string' })
  @IsNotEmpty()
  @IsString()
  locationTypeId: string;

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
  @ApiProperty({ description: 'Region Code', type: 'string' })
  @IsNotEmpty()
  @IsString()
  regionCode: string;

  /**
   * Surface Area
   */
  @ApiProperty({ description: 'Surface Area', type: 'number', required: false })
  @IsNumber()
  @IsOptional()
  surfaceArea?: number;
}
