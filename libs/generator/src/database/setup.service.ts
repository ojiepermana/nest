/**
 * Database Setup Service
 *
 * Handles automated metadata schema creation and validation
 * Supports both PostgreSQL and MySQL databases
 */

import { DatabaseConnectionManager } from './connection.manager';
import { Logger } from '../utils/logger.util';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface SetupResult {
  schemaExists: boolean;
  tablesCreated: string[];
  errors: string[];
}

export class DatabaseSetupService {
  constructor(private readonly connection: DatabaseConnectionManager) {}

  /**
   * Check if metadata schema exists
   */
  async checkSchemaExists(schemaName: string = 'meta'): Promise<boolean> {
    const dbType = this.connection.getDatabaseType();

    try {
      if (dbType === 'postgresql') {
        const result = await this.connection.query<{ exists: boolean }>(
          'SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = $1) as exists',
          [schemaName],
        );
        return result.rows[0]?.exists || false;
      } else if (dbType === 'mysql') {
        const result = await this.connection.query<{ schema_name: string }>(
          'SELECT schema_name FROM information_schema.schemata WHERE schema_name = ?',
          [schemaName],
        );
        return result.rows.length > 0;
      }

      return false;
    } catch (error) {
      Logger.error('Error checking schema existence', error as Error);
      throw error;
    }
  }

  /**
   * Check if table exists in schema
   */
  async checkTableExists(
    schemaName: string,
    tableName: string,
  ): Promise<boolean> {
    const dbType = this.connection.getDatabaseType();

    try {
      if (dbType === 'postgresql') {
        const result = await this.connection.query<{ exists: boolean }>(
          `SELECT EXISTS(
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = $2
          ) as exists`,
          [schemaName, tableName],
        );
        return result.rows[0]?.exists || false;
      } else if (dbType === 'mysql') {
        const result = await this.connection.query<{ table_name: string }>(
          `SELECT table_name FROM information_schema.tables 
           WHERE table_schema = ? AND table_name = ?`,
          [schemaName, tableName],
        );
        return result.rows.length > 0;
      }

      return false;
    } catch (error) {
      Logger.error('Error checking table existence', error as Error);
      throw error;
    }
  }

  /**
   * Setup metadata schema and tables
   */
  async setupMetadataSchema(schemaName: string = 'meta'): Promise<SetupResult> {
    const result: SetupResult = {
      schemaExists: false,
      tablesCreated: [],
      errors: [],
    };

    try {
      Logger.info(`Setting up metadata schema: ${schemaName}`);

      // Check if schema exists
      result.schemaExists = await this.checkSchemaExists(schemaName);

      if (result.schemaExists) {
        Logger.info(`Schema "${schemaName}" already exists`);
      } else {
        Logger.info(`Creating schema "${schemaName}"...`);
        await this.createSchema(schemaName);
        result.schemaExists = true;
        Logger.success(`Schema "${schemaName}" created`);
      }

      // Load and execute SQL setup file
      const sqlFile = await this.loadSetupSQL();
      await this.executeSetupSQL(sqlFile, schemaName, result);

      // Verify required tables
      const requiredTables = [
        'table_metadata',
        'column_metadata',
        'generated_files',
      ];
      for (const table of requiredTables) {
        const exists = await this.checkTableExists(schemaName, table);
        if (exists) {
          Logger.success(`✓ Table "${schemaName}.${table}" exists`);
          if (!result.tablesCreated.includes(table)) {
            result.tablesCreated.push(table);
          }
        } else {
          const error = `Table "${schemaName}.${table}" was not created`;
          Logger.error(error);
          result.errors.push(error);
        }
      }

      if (result.errors.length === 0) {
        Logger.success('Metadata schema setup completed successfully');
      } else {
        Logger.warn(`Setup completed with ${result.errors.length} errors`);
      }

      return result;
    } catch (error) {
      Logger.error('Failed to setup metadata schema', error as Error);
      result.errors.push((error as Error).message);
      throw error;
    }
  }

  /**
   * Create schema
   */
  private async createSchema(schemaName: string): Promise<void> {
    const dbType = this.connection.getDatabaseType();

    if (dbType === 'postgresql') {
      await this.connection.query(
        `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
      );
    } else if (dbType === 'mysql') {
      await this.connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${schemaName}\``,
      );
    }
  }

  /**
   * Load SQL setup file based on database type
   */
  private async loadSetupSQL(): Promise<string> {
    const dbType = this.connection.getDatabaseType();
    const fileName = dbType === 'postgresql' ? 'postgresql.sql' : 'mysql.sql';
    const filePath = join(__dirname, 'schemas', fileName);

    try {
      const sql = await readFile(filePath, 'utf-8');
      Logger.debug(`Loaded SQL setup file: ${fileName}`);
      return sql;
    } catch (error) {
      Logger.error(
        `Failed to load SQL setup file: ${fileName}`,
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Execute setup SQL file
   */
  private async executeSetupSQL(
    sql: string,
    schemaName: string,
    result: SetupResult,
  ): Promise<void> {
    try {
      // Replace schema placeholders
      const processedSQL = sql.replace(/\{SCHEMA_NAME\}/g, schemaName);

      // Split by statement separator and execute
      const statements = this.splitSQLStatements(processedSQL);

      Logger.info(`Executing ${statements.length} SQL statements...`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (statement.length === 0 || statement.startsWith('--')) {
          continue;
        }

        try {
          await this.connection.query(statement);
          Logger.debug(`✓ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          const errorMsg = `Failed to execute statement ${i + 1}: ${(error as Error).message}`;
          Logger.warn(errorMsg);
          // Don't throw, just log - some statements may fail if already exist
          if (!(error as Error).message.includes('already exists')) {
            result.errors.push(errorMsg);
          }
        }
      }

      Logger.success('SQL setup file executed');
    } catch (error) {
      Logger.error('Error executing setup SQL', error as Error);
      throw error;
    }
  }

  /**
   * Split SQL file into individual statements
   */
  private splitSQLStatements(sql: string): string[] {
    // Remove comments
    const processed = sql.replace(/--.*$/gm, '');

    // Split by semicolon but respect quoted strings
    const statements: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < processed.length; i++) {
      const char = processed[i];
      const prevChar = i > 0 ? processed[i - 1] : '';

      // Check for string delimiters
      if ((char === "'" || char === '"') && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }

      // Check for statement separator
      if (char === ';' && !inString) {
        if (current.trim().length > 0) {
          statements.push(current.trim());
        }
        current = '';
      } else {
        current += char;
      }
    }

    // Add last statement if any
    if (current.trim().length > 0) {
      statements.push(current.trim());
    }

    return statements;
  }

  /**
   * Validate metadata schema
   */
  async validateSchema(schemaName: string = 'meta'): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check schema exists
      const schemaExists = await this.checkSchemaExists(schemaName);
      if (!schemaExists) {
        errors.push(`Schema "${schemaName}" does not exist`);
      }

      // Check required tables
      const requiredTables = [
        'table_metadata',
        'column_metadata',
        'generated_files',
      ];
      for (const table of requiredTables) {
        const exists = await this.checkTableExists(schemaName, table);
        if (!exists) {
          errors.push(`Required table "${schemaName}.${table}" does not exist`);
        }
      }

      // Check table structure (basic column check)
      if (errors.length === 0) {
        await this.validateTableStructure(schemaName, 'table_metadata', [
          'id',
          'schema_name',
          'table_name',
          'has_soft_delete',
        ]);
        await this.validateTableStructure(schemaName, 'column_metadata', [
          'id',
          'table_metadata_id',
          'column_name',
          'data_type',
        ]);
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push((error as Error).message);
      return {
        valid: false,
        errors,
      };
    }
  }

  /**
   * Validate table has required columns
   */
  private async validateTableStructure(
    schemaName: string,
    tableName: string,
    requiredColumns: string[],
  ): Promise<void> {
    const dbType = this.connection.getDatabaseType();

    try {
      let result;
      if (dbType === 'postgresql') {
        result = await this.connection.query<{ column_name: string }>(
          `SELECT column_name FROM information_schema.columns 
           WHERE table_schema = $1 AND table_name = $2`,
          [schemaName, tableName],
        );
      } else {
        result = await this.connection.query<{ column_name: string }>(
          `SELECT column_name FROM information_schema.columns 
           WHERE table_schema = ? AND table_name = ?`,
          [schemaName, tableName],
        );
      }

      const existingColumns = result.rows.map((r) => r.column_name);

      for (const required of requiredColumns) {
        if (!existingColumns.includes(required)) {
          throw new Error(
            `Table "${schemaName}.${tableName}" missing required column: ${required}`,
          );
        }
      }
    } catch (error) {
      Logger.error(
        `Error validating table structure for ${tableName}`,
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Drop metadata schema (DANGEROUS - for testing only)
   */
  async dropSchema(
    schemaName: string = 'meta',
    cascade: boolean = true,
  ): Promise<void> {
    const dbType = this.connection.getDatabaseType();

    Logger.warn(`⚠️  DROPPING schema "${schemaName}"...`);

    try {
      if (dbType === 'postgresql') {
        await this.connection.query(
          `DROP SCHEMA IF EXISTS "${schemaName}" ${cascade ? 'CASCADE' : ''}`,
        );
      } else if (dbType === 'mysql') {
        await this.connection.query(
          `DROP DATABASE IF EXISTS \`${schemaName}\``,
        );
      }

      Logger.success(`Schema "${schemaName}" dropped`);
    } catch (error) {
      Logger.error('Failed to drop schema', error as Error);
      throw error;
    }
  }
}
