/**
 * JOIN Query Generator
 *
 * Automatically generates JOIN clauses based on foreign key metadata
 * Supports INNER/LEFT JOIN, nested JOINs, and multiple JOINs to same table
 */

import type {
  ColumnMetadata,
  DatabaseType,
} from '../../interfaces/generator.interface';
import { DialectFactory } from '../../database/dialects';
import type { IDatabaseDialect } from '../../interfaces/base.interface';

export interface JoinConfig {
  type: 'INNER' | 'LEFT';
  schema: string;
  table: string;
  alias: string;
  column: string;
  refSchema: string;
  refTable: string;
  refColumn: string;
  selectColumns: string[];
}

export interface JoinQueryOptions {
  databaseType: DatabaseType;
  includeDeleted?: boolean;
  maxJoinDepth?: number;
}

export class JoinQueryGenerator {
  private dialect: IDatabaseDialect;
  private joinCounter: Map<string, number> = new Map();

  constructor(private options: JoinQueryOptions) {
    this.dialect = DialectFactory.create(options.databaseType);
  }

  /**
   * Generate JOIN clauses from foreign key columns
   */
  generateJoins(
    columns: ColumnMetadata[],
    mainTableAlias: string = 't',
  ): {
    joins: string[];
    selectColumns: string[];
  } {
    const fkColumns = columns.filter(
      (col) => col.ref_schema && col.ref_table && col.ref_column,
    );

    const joins: string[] = [];
    const selectColumns: string[] = [];

    fkColumns.forEach((col) => {
      const joinConfig = this.createJoinConfig(col, mainTableAlias);
      const joinClause = this.buildJoinClause(joinConfig);
      const selectCols = this.buildSelectColumns(joinConfig);

      joins.push(joinClause);
      selectColumns.push(...selectCols);
    });

    return { joins, selectColumns };
  }

  /**
   * Create JOIN configuration from foreign key column
   */
  private createJoinConfig(
    col: ColumnMetadata,
    mainTableAlias: string,
  ): JoinConfig {
    const refTableKey = `${col.ref_schema}.${col.ref_table}`;
    const count = this.joinCounter.get(refTableKey) || 0;
    this.joinCounter.set(refTableKey, count + 1);

    // Generate unique alias for multiple JOINs to same table
    const alias =
      count > 0
        ? `${col.ref_table}_${col.column_name}`
        : `${col.ref_table}_alias`;

    // Determine JOIN type based on nullability
    const joinType = col.is_nullable ? 'LEFT' : 'INNER';

    // Determine which columns to SELECT from referenced table
    const selectColumns = this.getDisplayColumns(col);

    return {
      type: joinType,
      schema: col.ref_schema || 'public',
      table: mainTableAlias,
      alias,
      column: col.column_name,
      refSchema: col.ref_schema || 'public',
      refTable: col.ref_table || '',
      refColumn: col.ref_column || 'id',
      selectColumns,
    };
  }

  /**
   * Build JOIN clause SQL
   */
  private buildJoinClause(config: JoinConfig): string {
    const refTable = this.dialect.quoteIdentifier(
      `${config.refSchema}.${config.refTable}`,
    );
    const mainColumn = this.dialect.quoteIdentifier(
      `${config.table}.${config.column}`,
    );
    const refColumn = this.dialect.quoteIdentifier(
      `${config.alias}.${config.refColumn}`,
    );

    let joinClause = `${config.type} JOIN ${refTable} AS ${this.dialect.quoteIdentifier(config.alias)}
    ON ${mainColumn} = ${refColumn}`;

    // Add soft delete check if enabled
    if (!this.options.includeDeleted) {
      joinClause += `
    AND ${this.dialect.quoteIdentifier(`${config.alias}.deleted_at`)} IS NULL`;
    }

    return joinClause;
  }

  /**
   * Build SELECT columns from joined table
   */
  private buildSelectColumns(config: JoinConfig): string[] {
    return config.selectColumns.map((col) => {
      const quotedCol = this.dialect.quoteIdentifier(`${config.alias}.${col}`);
      const aliasName = `${config.refTable}_${col}`;
      return `${quotedCol} AS ${this.dialect.quoteIdentifier(aliasName)}`;
    });
  }

  /**
   * Get display columns from referenced table
   * Common display columns: name, title, code, description
   */
  private getDisplayColumns(col: ColumnMetadata): string[] {
    // If ref_display_column is specified, use it
    if ((col as any).ref_display_column) {
      return [(col as any).ref_display_column];
    }

    // Default common display columns
    return ['name', 'title', 'code', 'description'].slice(0, 2);
  }

  /**
   * Generate complete SELECT clause with JOINs
   */
  generateSelectWithJoins(
    mainTableAlias: string,
    mainColumns: ColumnMetadata[],
    joinColumns: string[],
  ): string {
    const mainSelects = mainColumns
      .filter((col) => col.display_in_list || col.display_in_detail)
      .map((col) => {
        const quotedCol = this.dialect.quoteIdentifier(
          `${mainTableAlias}.${col.column_name}`,
        );
        return quotedCol;
      });

    const allSelects = [...mainSelects, ...joinColumns];

    return `SELECT
    ${allSelects.join(',\n    ')}`;
  }

  /**
   * Reset join counter for new query generation
   */
  reset(): void {
    this.joinCounter.clear();
  }
}
