import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateBusinessEntityDto } from '@app/contracts/entity';
import { IsString, IsOptional } from 'class-validator';

/**
 * Gateway Create DTO
 * Extends base contract with HTTP-specific validation and Swagger
 */
export class CreateBusinessEntityRequestDto extends CreateBusinessEntityDto {
  // Override properties to add Swagger decorators if needed
  // Example:
  // @ApiProperty({ example: 'Example value' })
  // @IsString()
  // name: string;
}

// Re-export base contract for compatibility
export { CreateBusinessEntityDto };
