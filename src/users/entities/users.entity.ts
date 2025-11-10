/**
 * User accounts table
 * Table: users
 */
export class Users {
  /** Primary key */
  id?: string;
  /** Unique username */
  username: string;
  /** User email address */
  email: string;
  /** Hashed password */
  passwordHash: string;
  /** Full name of user */
  fullName?: string;
  /** Account active status */
  isActive?: boolean;
  /** Creation timestamp */
  createdAt?: Date;
  /** Last update timestamp */
  updatedAt?: Date;
  /** Soft delete timestamp */
  deletedAt?: Date;
}
