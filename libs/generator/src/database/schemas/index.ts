/**
 * Database schema files for metadata tables
 *
 * These SQL scripts create the required metadata tables for the NestJS generator:
 * - meta.table_metadata (PostgreSQL) / meta_table_metadata (MySQL)
 * - meta.column_metadata (PostgreSQL) / meta_column_metadata (MySQL)
 * - meta.generated_files (PostgreSQL) / meta_generated_files (MySQL)
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Get SQL schema script for specified database type
 * @param databaseType - 'postgresql' or 'mysql'
 * @returns SQL script content
 */
export function getSchema(databaseType: 'postgresql' | 'mysql'): string {
  const schemaPath = join(__dirname, `${databaseType}.sql`);
  return readFileSync(schemaPath, 'utf-8');
}

/**
 * Get schema script based on database type
 * @param databaseType - 'postgresql' or 'mysql'
 * @returns SQL script content
 */
export function getSchemaForDatabase(databaseType: 'postgresql' | 'mysql'): string {
  const schemaPath = join(__dirname, `${databaseType}.sql`);
  return readFileSync(schemaPath, 'utf-8');
}
