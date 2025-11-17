import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateLocationDto } from '@app/contracts/entity';

/**
 * Gateway Update DTO
 * Extends base contract with HTTP-specific validation and Swagger
 */
export class UpdateLocationRequestDto extends UpdateLocationDto {
  // Override properties to add Swagger decorators if needed
}

// Re-export base contract for compatibility
export { UpdateLocationDto };
