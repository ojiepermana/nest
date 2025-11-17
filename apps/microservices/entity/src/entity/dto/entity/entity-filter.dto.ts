import { EntityFilterDto } from '@app/contracts/entity';

/**
 * Service-specific Filter DTO
 * Extends base contract with internal validation
 */
export class EntityFilterInternalDto extends EntityFilterDto {
  // Add service-specific filters here if needed
}

// Re-export base contract for compatibility
export { EntityFilterDto };
