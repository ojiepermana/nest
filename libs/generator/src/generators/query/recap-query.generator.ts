/**
 * Recap Query Generator
 *
 * Generates SQL queries for yearly recap with dynamic GROUP BY
 * Supports single and dual field grouping with monthly breakdown
 */

import type {
  TableMetadata,
  ColumnMetadata,
  DatabaseType,
} from '../../interfaces/generator.interface';
import { DialectFactory } from '../../database/dialects';
import type { IDatabaseDialect } from '../../interfaces/base.interface';

export interface RecapQueryConfig {
  databaseType: DatabaseType;
  dateColumn?: string; // Default: created_at
  tableName: string;
  schemaName: string;
}

export class RecapQueryGenerator {
  private dialect: IDatabaseDialect;

  constructor(private config: RecapQueryConfig) {
    this.dialect = DialectFactory.create(config.databaseType);
  }

  /**
   * Generate yearly recap query with dynamic GROUP BY
   */
  generateRecapQuery(table: TableMetadata, columns: ColumnMetadata[]): string {
    const dateCol = this.config.dateColumn || 'created_at';
    const schemaTable = this.dialect.quoteIdentifier(
      `${this.config.schemaName}.${this.config.tableName}`,
    );

    // Build SELECT clause with monthly aggregation
    const monthlySelects = this.generateMonthlySelects(dateCol);

    // Build WHERE clause
    const whereClause = this.generateWhereClause(dateCol);

    return `
  /**
   * Get yearly recap with monthly breakdown
   * Supports dynamic grouping by 1 or 2 fields
   */
  getYearlyRecap: (year: number, groupBy: string[], filters?: any) => {
    // Validate and quote identifiers
    const validFields = [${this.getValidGroupByFields(columns)}];
    const groupFields = groupBy
      .slice(0, 2)
      .map(f => f.toLowerCase())
      .filter(f => validFields.includes(f));

    if (groupFields.length === 0) {
      throw new Error('Invalid group_by fields');
    }

    // Build GROUP BY clause
    const groupByClause = groupFields
      .map((f, i) => \`\${this.dialect.quoteIdentifier(f)} as field_\${i + 1}\`)
      .join(', ');

    // Build SELECT clause
    const selectFields = groupFields.map((f, i) => \`field_\${i + 1}\`);

    // Base query
    let query = \`
      SELECT
        \${groupByClause},
        ${monthlySelects},
        COUNT(*) as total
      FROM ${schemaTable}
      ${whereClause}
    \`;

    // Add filter conditions
    const params: any[] = [year];
    let paramIndex = 2;

    if (filters) {
      const filterClauses: string[] = [];
      
      Object.keys(filters).forEach(key => {
        if (key !== 'year' && key !== 'group_by' && filters[key]) {
          // Remove _eq suffix to get column name
          const colName = key.replace(/_eq$/, '');
          if (validFields.includes(colName)) {
            filterClauses.push(\`\${this.dialect.quoteIdentifier(colName)} = \${this.dialect.getParameterPlaceholder(paramIndex)}\`);
            params.push(filters[key]);
            paramIndex++;
          }
        }
      });

      if (filterClauses.length > 0) {
        query += \` AND \${filterClauses.join(' AND ')}\`;
      }
    }

    // Add GROUP BY
    query += \` GROUP BY \${selectFields.join(', ')}\`;
    
    // Add ORDER BY
    query += \` ORDER BY \${selectFields.join(', ')}\`;

    return { query, params };
  },
`;
  }

  /**
   * Generate monthly aggregation SELECTs
   */
  private generateMonthlySelects(dateCol: string): string {
    const months = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec',
    ];

    const selects = months.map((month, index) => {
      const monthNum = index + 1;
      if (this.config.databaseType === 'postgresql') {
        return `COUNT(CASE WHEN EXTRACT(MONTH FROM ${this.dialect.quoteIdentifier(dateCol)}) = ${monthNum} THEN 1 END) as ${month}`;
      } else {
        // MySQL
        return `COUNT(CASE WHEN MONTH(${this.dialect.quoteIdentifier(dateCol)}) = ${monthNum} THEN 1 END) as ${month}`;
      }
    });

    return selects.join(',\n        ');
  }

  /**
   * Generate WHERE clause for year filtering
   */
  private generateWhereClause(dateCol: string): string {
    const quotedCol = this.dialect.quoteIdentifier(dateCol);

    if (this.config.databaseType === 'postgresql') {
      return `WHERE EXTRACT(YEAR FROM ${quotedCol}) = $1
        AND deleted_at IS NULL`;
    } else {
      // MySQL
      return `WHERE YEAR(${quotedCol}) = ?
        AND deleted_at IS NULL`;
    }
  }

  /**
   * Generate dynamic GROUP BY clause
   */
  private generateGroupByClause(): string {
    // This method is kept for future enhancements
    return '${groupFields.map(f => this.dialect.quoteIdentifier(f)).join(", ")}';
  }

  /**
   * Get valid group by fields from filterable columns
   */
  private getValidGroupByFields(columns: ColumnMetadata[]): string {
    const validFields = columns
      .filter((col) => col.is_filterable && !col.is_primary_key)
      .map((col) => `'${col.column_name.toLowerCase()}'`);

    return validFields.join(', ');
  }
}
