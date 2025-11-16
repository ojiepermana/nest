/**
 * Business entity types and classifications
 * Table: business_entity
 */
export class BusinessEntity {
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
  /** Prefix */
  prefix?: string;
  /** Record status (active/inactive) */
  status?: string;
  /** Suffix */
  suffix?: string;
  /** Last update timestamp (auto-updated) */
  updatedAt?: Date;
}
