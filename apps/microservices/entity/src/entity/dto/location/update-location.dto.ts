import { UpdateLocationDto } from '@app/contracts/entity';

/**
 * Service-specific Update DTO
 * Extends base contract with internal validation
 */
export class UpdateLocationInternalDto extends UpdateLocationDto {
  // Add service-specific fields here if needed
}

// Re-export base contract for compatibility
export { UpdateLocationDto };
