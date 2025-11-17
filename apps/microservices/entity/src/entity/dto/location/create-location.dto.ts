import { LocationDto as CreateLocationDto } from '@app/contracts/entity';

/**
 * Service-specific Create DTO
 * Extends base contract with internal validation
 */
export class CreateLocationInternalDto extends CreateLocationDto {
  // Add service-specific fields here if needed
  // Example:
  // @IsUUID()
  // tenantId?: string;
}

// Re-export base contract for compatibility
export { CreateLocationDto };
