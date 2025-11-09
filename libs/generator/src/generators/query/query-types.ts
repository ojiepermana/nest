/**
 * Query Generator Types
 *
 * Type definitions for SQL query generation
 */

/**
 * Sort order
 */
export type SortOrder = 'ASC' | 'DESC';

/**
 * Join types
 */
export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';

/**
 * Filter operators for WHERE clauses
 */
export enum QueryFilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  LIKE = 'like',
  IN = 'in',
  BETWEEN = 'between',
  IS_NULL = 'null',
}

/**
 * WHERE condition
 */
export interface WhereCondition {
  column: string;
  operator: QueryFilterOperator;
  value?: any;
  paramName?: string;
}

/**
 * JOIN clause
 */
export interface JoinClause {
  type: JoinType;
  table: string;
  alias?: string;
  on: {
    left: string;
    right: string;
  };
}

/**
 * ORDER BY clause
 */
export interface OrderByClause {
  column: string;
  order: SortOrder;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * SELECT query options
 */
export interface SelectQueryOptions {
  table: string;
  alias?: string;
  columns?: string[];
  where?: WhereCondition[];
  joins?: JoinClause[];
  orderBy?: OrderByClause[];
  pagination?: PaginationOptions;
  groupBy?: string[];
  having?: WhereCondition[];
}

/**
 * INSERT query options
 */
export interface InsertQueryOptions {
  table: string;
  columns: string[];
  values: any[];
  returning?: string[];
}

/**
 * UPDATE query options
 */
export interface UpdateQueryOptions {
  table: string;
  columns: string[];
  values: any[];
  where?: WhereCondition[];
  returning?: string[];
}

/**
 * DELETE query options
 */
export interface DeleteQueryOptions {
  table: string;
  where?: WhereCondition[];
  returning?: string[];
}

/**
 * Generated query result
 */
export interface GeneratedQuery {
  sql: string;
  params: Record<string, any>;
}
