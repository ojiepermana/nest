import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateEntityDto } from '@app/contracts/entity';
import { IsString, IsOptional } from 'class-validator';

/**
 * Gateway Create DTO
 * Extends base contract with HTTP-specific validation and Swagger
 */
export class CreateEntityRequestDto extends CreateEntityDto {
  // Override properties to add Swagger decorators if needed
  // Example:
  // @ApiProperty({ example: 'Example value' })
  // @IsString()
  // name: string;
}

// Re-export base contract for compatibility
export { CreateEntityDto };
