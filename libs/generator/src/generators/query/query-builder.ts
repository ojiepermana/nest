/**
 * Query Builder
 *
 * Builds SQL queries from DTO filters with parameter binding and SQL injection prevention
 */

import { QueryGenerator } from './query-generator';
import {
  QueryFilterOperator,
  type WhereCondition,
  type SelectQueryOptions,
  type InsertQueryOptions,
  type UpdateQueryOptions,
  type DeleteQueryOptions,
  type GeneratedQuery,
  type JoinClause,
  type OrderByClause,
  type PaginationOptions,
} from './query-types';
import type { DatabaseType } from '../../types/architecture.type';

/**
 * Sort direction from filter DTO
 */
export interface SortParam {
  field: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Pagination parameters from request
 */
export interface PaginationParam {
  page?: number;
  limit?: number;
}

/**
 * Filter parameters extracted from DTO
 */
export interface FilterParams {
  [key: string]: any;
}

export class QueryBuilder {
  private generator: QueryGenerator;
  private tableName: string;
  private tableAlias?: string;
  private whereConditions: WhereCondition[] = [];
  private joinClauses: JoinClause[] = [];
  private orderByClauses: OrderByClause[] = [];
  private selectColumns?: string[];
  private paginationOptions?: PaginationOptions;
  private groupByColumns?: string[];
  private havingConditions: WhereCondition[] = [];

  constructor(tableName: string, dbType: DatabaseType = 'postgresql', alias?: string) {
    this.tableName = tableName;
    this.tableAlias = alias;
    this.generator = new QueryGenerator(dbType);
  }

  /**
   * Add filter conditions from DTO
   */
  addFilters(filterDto: FilterParams): this {
    Object.keys(filterDto).forEach((key) => {
      const value = filterDto[key];
      if (value === undefined || value === null) {
        return;
      }

      // Check if it's an operator-based filter (e.g., name_eq, age_gt)
      const operatorMatch = key.match(/^(.+)_(eq|ne|gt|gte|lt|lte|like|in|between|null)$/);

      if (operatorMatch) {
        const [, columnName, operatorStr] = operatorMatch;
        const operator = this.mapOperatorString(operatorStr);

        if (operator) {
          this.whereConditions.push({
            column: this.getQualifiedColumn(columnName),
            operator,
            value,
          });
        }
      } else {
        // Simple equality filter
        this.whereConditions.push({
          column: this.getQualifiedColumn(key),
          operator: QueryFilterOperator.EQUALS,
          value,
        });
      }
    });

    return this;
  }

  /**
   * Add a WHERE condition
   */
  where(column: string, operator: QueryFilterOperator, value?: any): this {
    this.whereConditions.push({
      column: this.getQualifiedColumn(column),
      operator,
      value,
    });
    return this;
  }

  /**
   * Add an AND WHERE condition (alias for where)
   */
  andWhere(column: string, operator: QueryFilterOperator, value?: any): this {
    return this.where(column, operator, value);
  }

  /**
   * Add a JOIN clause
   */
  join(
    type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL',
    table: string,
    leftColumn: string,
    rightColumn: string,
    alias?: string,
  ): this {
    this.joinClauses.push({
      type,
      table,
      alias,
      on: {
        left: this.getQualifiedColumn(leftColumn),
        right: alias ? `${alias}.${rightColumn}` : `${table}.${rightColumn}`,
      },
    });
    return this;
  }

  /**
   * Add INNER JOIN
   */
  innerJoin(table: string, leftColumn: string, rightColumn: string, alias?: string): this {
    return this.join('INNER', table, leftColumn, rightColumn, alias);
  }

  /**
   * Add LEFT JOIN
   */
  leftJoin(table: string, leftColumn: string, rightColumn: string, alias?: string): this {
    return this.join('LEFT', table, leftColumn, rightColumn, alias);
  }

  /**
   * Add ORDER BY from sort parameters
   */
  addSort(sortParams: SortParam[]): this {
    sortParams.forEach((sort) => {
      this.orderByClauses.push({
        column: this.getQualifiedColumn(sort.field),
        order: sort.direction,
      });
    });
    return this;
  }

  /**
   * Add ORDER BY clause
   */
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByClauses.push({
      column: this.getQualifiedColumn(column),
      order: direction,
    });
    return this;
  }

  /**
   * Add pagination
   */
  paginate(pagination: PaginationParam): this {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;

    this.paginationOptions = {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)), // Max 100 items per page
    };
    return this;
  }

  /**
   * Set LIMIT and OFFSET
   */
  limit(limit: number, offset?: number): this {
    const page = offset ? Math.floor(offset / limit) + 1 : 1;
    this.paginationOptions = { page, limit };
    return this;
  }

  /**
   * Select specific columns
   */
  select(columns: string[]): this {
    this.selectColumns = columns.map((col) => this.getQualifiedColumn(col));
    return this;
  }

  /**
   * Add GROUP BY
   */
  groupBy(columns: string[]): this {
    this.groupByColumns = columns.map((col) => this.getQualifiedColumn(col));
    return this;
  }

  /**
   * Add HAVING condition
   */
  having(column: string, operator: QueryFilterOperator, value: any): this {
    this.havingConditions.push({
      column,
      operator,
      value,
    });
    return this;
  }

  /**
   * Build and return SELECT query
   */
  buildSelect(): GeneratedQuery {
    const options: SelectQueryOptions = {
      table: this.tableName,
      alias: this.tableAlias,
      columns: this.selectColumns,
      where: this.whereConditions.length > 0 ? this.whereConditions : undefined,
      joins: this.joinClauses.length > 0 ? this.joinClauses : undefined,
      orderBy: this.orderByClauses.length > 0 ? this.orderByClauses : undefined,
      pagination: this.paginationOptions,
      groupBy: this.groupByColumns,
      having: this.havingConditions.length > 0 ? this.havingConditions : undefined,
    };

    return this.generator.generateSelect(options);
  }

  /**
   * Build and return COUNT query for pagination
   */
  buildCount(): GeneratedQuery {
    const options: SelectQueryOptions = {
      table: this.tableName,
      alias: this.tableAlias,
      where: this.whereConditions.length > 0 ? this.whereConditions : undefined,
      joins: this.joinClauses.length > 0 ? this.joinClauses : undefined,
    };

    return this.generator.generateCount(options);
  }

  /**
   * Build and return INSERT query
   */
  buildInsert(data: Record<string, any>, returning?: string[]): GeneratedQuery {
    const columns = Object.keys(data);
    const values = Object.values(data);

    const options: InsertQueryOptions = {
      table: this.tableName,
      columns,
      values,
      returning,
    };

    return this.generator.generateInsert(options);
  }

  /**
   * Build and return UPDATE query
   */
  buildUpdate(data: Record<string, any>, returning?: string[]): GeneratedQuery {
    const columns = Object.keys(data);
    const values = Object.values(data);

    const options: UpdateQueryOptions = {
      table: this.tableName,
      columns,
      values,
      where: this.whereConditions.length > 0 ? this.whereConditions : undefined,
      returning,
    };

    return this.generator.generateUpdate(options);
  }

  /**
   * Build and return DELETE query
   */
  buildDelete(returning?: string[]): GeneratedQuery {
    const options: DeleteQueryOptions = {
      table: this.tableName,
      where: this.whereConditions.length > 0 ? this.whereConditions : undefined,
      returning,
    };

    return this.generator.generateDelete(options);
  }

  /**
   * Reset the builder state
   */
  reset(): this {
    this.whereConditions = [];
    this.joinClauses = [];
    this.orderByClauses = [];
    this.selectColumns = undefined;
    this.paginationOptions = undefined;
    this.groupByColumns = undefined;
    this.havingConditions = [];
    return this;
  }

  /**
   * Create a new query builder instance
   */
  static create(
    tableName: string,
    dbType: DatabaseType = 'postgresql',
    alias?: string,
  ): QueryBuilder {
    return new QueryBuilder(tableName, dbType, alias);
  }

  /**
   * Map operator string to QueryFilterOperator
   */
  private mapOperatorString(operatorStr: string): QueryFilterOperator | null {
    const operatorMap: Record<string, QueryFilterOperator> = {
      eq: QueryFilterOperator.EQUALS,
      ne: QueryFilterOperator.NOT_EQUALS,
      gt: QueryFilterOperator.GREATER_THAN,
      gte: QueryFilterOperator.GREATER_THAN_OR_EQUAL,
      lt: QueryFilterOperator.LESS_THAN,
      lte: QueryFilterOperator.LESS_THAN_OR_EQUAL,
      like: QueryFilterOperator.LIKE,
      in: QueryFilterOperator.IN,
      between: QueryFilterOperator.BETWEEN,
      null: QueryFilterOperator.IS_NULL,
    };

    return operatorMap[operatorStr] || null;
  }

  /**
   * Get qualified column name (with table alias if set)
   */
  private getQualifiedColumn(columnName: string): string {
    // If column already has a qualifier (contains .), return as is
    if (columnName.includes('.')) {
      return columnName;
    }

    // Add table alias if set
    if (this.tableAlias) {
      return `${this.tableAlias}.${columnName}`;
    }

    return columnName;
  }
}
