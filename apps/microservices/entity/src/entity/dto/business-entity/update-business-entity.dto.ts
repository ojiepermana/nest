import { UpdateBusinessEntityDto } from '@app/contracts/entity';

/**
 * Service-specific Update DTO
 * Extends base contract with internal validation
 */
export class UpdateBusinessEntityInternalDto extends UpdateBusinessEntityDto {
  // Add service-specific fields here if needed
}

// Re-export base contract for compatibility
export { UpdateBusinessEntityDto };
