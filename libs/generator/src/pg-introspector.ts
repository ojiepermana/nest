import { Logger } from '@nestjs/common';
import { SchemaIntrospector, TableMetadata, ColumnDefinition } from './types';

export interface PgIntrospectorOptions {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean | Record<string, unknown>;
}

export class PgSchemaIntrospector implements SchemaIntrospector {
  private readonly logger = new Logger(PgSchemaIntrospector.name);
  private pool: any;

  constructor(private readonly options: PgIntrospectorOptions) {}

  private async getPool(): Promise<any> {
    if (this.pool) {
      return this.pool;
    }

    try {
      const pg = await import('pg');
      const { Pool } = pg;
      this.pool = new Pool(this.options as Record<string, unknown>);
      return this.pool;
    } catch (error) {
      this.logger.error('`pg` module is required to introspect the database.');
      throw error;
    }
  }

  async getTableMetadata(schema: string, table: string): Promise<TableMetadata> {
    const pool = await this.getPool();
    const client = await pool.connect();

    try {
      const columnsResult = await client.query(
        `
        SELECT
          c.column_name,
          c.is_nullable,
          c.data_type,
          c.column_default,
          pgd.description,
          tc.constraint_type,
          EXISTS (
            SELECT 1
            FROM information_schema.table_constraints tc2
            JOIN information_schema.key_column_usage kcu2
              ON tc2.constraint_name = kcu2.constraint_name
            WHERE tc2.constraint_type = 'UNIQUE'
              AND tc2.table_schema = c.table_schema
              AND tc2.table_name = c.table_name
              AND kcu2.column_name = c.column_name
          ) AS is_unique,
          EXISTS (
            SELECT 1
            FROM information_schema.columns c2
            WHERE c2.table_schema = c.table_schema
              AND c2.table_name = c.table_name
              AND c2.column_name IN ('created_at', 'updated_at', 'deleted_at')
          ) AS has_timestamps,
          pg_get_expr(d.adbin, d.adrelid) AS default_expr,
          t.typcategory,
          e.enumlabel
        FROM information_schema.columns c
        LEFT JOIN pg_catalog.pg_description pgd
          ON pgd.objsubid = c.ordinal_position
         AND pgd.objoid = (
           SELECT oid FROM pg_catalog.pg_class
           WHERE relname = c.table_name AND relnamespace = (
             SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = c.table_schema
           )
         )
        LEFT JOIN information_schema.key_column_usage kcu
          ON c.table_schema = kcu.table_schema
         AND c.table_name = kcu.table_name
         AND c.column_name = kcu.column_name
        LEFT JOIN information_schema.table_constraints tc
          ON kcu.constraint_name = tc.constraint_name
         AND tc.constraint_type = 'PRIMARY KEY'
        LEFT JOIN pg_catalog.pg_type t
          ON t.typname = c.udt_name
        LEFT JOIN pg_catalog.pg_enum e
          ON t.oid = e.enumtypid
        LEFT JOIN pg_catalog.pg_attrdef d
          ON d.adrelid = (
            SELECT oid FROM pg_catalog.pg_class
            WHERE relname = c.table_name AND relnamespace = (
              SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = c.table_schema
            )
          )
         AND d.adnum = c.ordinal_position
        WHERE c.table_schema = $1 AND c.table_name = $2
        ORDER BY c.ordinal_position
      `,
        [schema, table],
      );

      const columns = new Map<string, ColumnDefinition>();
      const enumValues = new Map<string, string[]>();
      let hasTimestamps = false;

      for (const row of columnsResult.rows) {
        const columnName = row.column_name as string;
        const isPrimaryKey = row.constraint_type === 'PRIMARY KEY';
        const tsType = mapPostgresTypeToTs(row.data_type as string);
        const column: ColumnDefinition = {
          name: columnName,
          dbType: row.data_type,
          tsType,
          isNullable: row.is_nullable === 'YES',
          isPrimaryKey,
          hasDefault: Boolean(row.column_default),
          comment: row.description || undefined,
          isGenerated: Boolean(row.column_default && row.column_default.includes('nextval')),
        };

        columns.set(columnName, column);
        if (row.enumlabel) {
          const values = enumValues.get(columnName) ?? [];
          values.push(row.enumlabel as string);
          enumValues.set(columnName, values);
        }

        if (['created_at', 'updated_at', 'deleted_at'].includes(columnName)) {
          hasTimestamps = true;
        }
      }

      enumValues.forEach((values, columnName) => {
        const column = columns.get(columnName);
        if (column) {
          column.enumValues = values;
        }
      });

      const primaryKey = Array.from(columns.values()).find((column) => column.isPrimaryKey);
      const uniqueColumns = Array.from(columns.entries())
        .filter(([, column]) => column.isPrimaryKey || column.hasDefault)
        .map(([name]) => name);

      return {
        schema,
        table,
        columns: Array.from(columns.values()),
        primaryKey,
        uniqueColumns,
        hasTimestamps,
      };
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = undefined;
    }
  }
}

const mapPostgresTypeToTs = (type: string): string => {
  switch (type) {
    case 'integer':
    case 'int':
    case 'int4':
    case 'bigint':
    case 'smallint':
    case 'numeric':
    case 'real':
    case 'double precision':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'json':
    case 'jsonb':
      return 'Record<string, any>';
    case 'timestamp without time zone':
    case 'timestamp with time zone':
    case 'date':
      return 'Date';
    case 'uuid':
      return 'string';
    case 'text':
    case 'character varying':
    case 'varchar':
    case 'char':
      return 'string';
    default:
      return 'string';
  }
};
