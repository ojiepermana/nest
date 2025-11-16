/**
 * Company branch offices and regional locations
 * Table: branch
 */
export class Branch {
  /** Address */
  address?: string;
  /** Unique code for identification */
  code?: string;
  /** Record creation timestamp */
  createdAt?: Date;
  /** Created By */
  createdBy?: string;
  /** Soft delete timestamp */
  deletedAt?: Date;
  /** Email */
  email?: string;
  /** Primary key - unique identifier */
  id?: string;
  /** No */
  no?: number;
  /** Legacy system ID for data migration */
  oldId?: string;
  /** Region Code */
  regionCode?: string;
  /** Regional */
  regional?: string;
  /** Type */
  type?: string;
  /** Last update timestamp (auto-updated) */
  updatedAt?: Date;
}
