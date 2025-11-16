/**
 * Location type categorization for different facility types
 * Table: location_type
 */
export class LocationType {
  /** Unique code for identification */
  code?: string;
  /** Record creation timestamp */
  createdAt?: Date;
  /** Soft delete timestamp */
  deletedAt?: Date;
  /** Detailed description */
  description?: string;
  /** Primary key - unique identifier */
  id?: string;
  /** Name or title */
  name?: string;
  /** Legacy system ID for data migration */
  oldId?: string;
  /** Record status (active/inactive) */
  status?: string;
  /** Last update timestamp (auto-updated) */
  updatedAt?: Date;
}
