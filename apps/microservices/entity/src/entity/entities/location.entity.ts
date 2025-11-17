/**
 * Physical locations and facilities for entities
 * Table: location
 */
export class Location {
  /** Branch Id */
  branchId?: string;
  /** Building Area */
  buildingArea?: number;
  /** Record creation timestamp */
  createdAt?: Date;
  /** Created By */
  createdBy?: string;
  /** Soft delete timestamp */
  deletedAt?: Date;
  /** Entity Id */
  entityId?: string;
  /** Primary key - unique identifier */
  id?: string;
  /** Location Type Id */
  locationTypeId?: string;
  /** Nitku */
  nitku?: string;
  /** Legacy system ID for data migration */
  oldId?: string;
  /** Postcode */
  postcode?: string;
  /** Region Code */
  regionCode?: string;
  /** Surface Area */
  surfaceArea?: number;
  /** Last update timestamp (auto-updated) */
  updatedAt?: Date;
}
