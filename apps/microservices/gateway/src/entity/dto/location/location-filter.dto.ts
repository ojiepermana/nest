import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationFilterDto } from '@app/contracts/entity';

/**
 * Gateway Filter DTO
 * Extends base contract with HTTP-specific validation and Swagger
 */
export class LocationFilterRequestDto extends LocationFilterDto {
  // Override properties to add Swagger decorators if needed
}

// Re-export base contract for compatibility
export { LocationFilterDto };
