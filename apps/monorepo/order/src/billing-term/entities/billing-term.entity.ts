/**
 * Billing document types for contract billing administration
 * Table: billing_term
 */
export class BillingTerm {
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
