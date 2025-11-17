import { UpdateEntityDto } from '@app/contracts/entity';

/**
 * Service-specific Update DTO
 * Extends base contract with internal validation
 */
export class UpdateEntityInternalDto extends UpdateEntityDto {
  // Add service-specific fields here if needed
}

// Re-export base contract for compatibility
export { UpdateEntityDto };
