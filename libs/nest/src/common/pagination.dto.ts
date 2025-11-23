import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Standard pagination DTO
 * Enterprise-grade pagination with validation and Swagger documentation
 */
export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    minimum: 1,
    maximum: 10000,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @Max(10000, { message: 'Page cannot exceed 10000' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  /**
   * Calculate offset for database queries
   */
  get offset(): number {
    return ((this.page || 1) - 1) * (this.limit || 10);
  }

  /**
   * Get take value for database queries
   */
  get take(): number {
    return this.limit || 10;
  }

  /**
   * Get skip value for database queries
   */
  get skip(): number {
    return this.offset;
  }
}
