import { BusinessEntityFilterDto } from '@app/contracts/entity';

/**
 * Service-specific Filter DTO
 * Extends base contract with internal validation
 */
export class BusinessEntityFilterInternalDto extends BusinessEntityFilterDto {
  // Add service-specific filters here if needed
}

// Re-export base contract for compatibility
export { BusinessEntityFilterDto };
