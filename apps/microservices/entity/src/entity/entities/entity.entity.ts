/**
 * Main entity records for customers, vendors, and business partners
 * Table: entity
 */
export class Entity {
  /** Address */
  address?: string;
  /** Avatar Doc Id */
  avatarDocId?: string;
  /** Birth Date */
  birthDate?: Date;
  /** Brand */
  brand?: string;
  /** Business Entity Id */
  businessEntityId?: string;
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
  /** Local Phone */
  localPhone?: string;
  /** Name or title */
  name?: string;
  /** Legacy system ID for data migration */
  oldId?: string;
  /** Postcode */
  postcode?: string;
  /** Region Code */
  regionCode?: string;
  /** Record status (active/inactive) */
  status?: string;
  /** Type */
  type?: string;
  /** Last update timestamp (auto-updated) */
  updatedAt?: Date;
}
