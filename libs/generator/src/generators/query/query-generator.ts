/**
 * Query Generator
 *
 * Generates SQL queries for SELECT, INSERT, UPDATE, DELETE operations
 */

import type { DatabaseType } from '../../types/architecture.type';
import {
  QueryFilterOperator,
  type GeneratedQuery,
  type SelectQueryOptions,
  type InsertQueryOptions,
  type UpdateQueryOptions,
  type DeleteQueryOptions,
  type WhereCondition,
  type JoinClause,
  type OrderByClause,
} from './query-types';

export class QueryGenerator {
  private paramCounter = 0;
  private dbType: DatabaseType;

  constructor(dbType: DatabaseType = 'postgresql') {
    this.dbType = dbType;
  }

  /**
   * Generate SELECT query
   */
  generateSelect(options: SelectQueryOptions): GeneratedQuery {
    this.resetParamCounter();
    const params: Record<string, any> = {};

    const tableName = options.alias
      ? `${options.table} ${options.alias}`
      : options.table;

    // SELECT clause
    const columns =
      options.columns && options.columns.length > 0
        ? options.columns.join(', ')
        : '*';
    let sql = `SELECT ${columns} FROM ${tableName}`;

    // JOIN clauses
    if (options.joins && options.joins.length > 0) {
      sql += this.buildJoinClauses(options.joins);
    }

    // WHERE clause
    if (options.where && options.where.length > 0) {
      const whereClause = this.buildWhereClause(options.where, params);
      sql += ` WHERE ${whereClause}`;
    }

    // GROUP BY clause
    if (options.groupBy && options.groupBy.length > 0) {
      sql += ` GROUP BY ${options.groupBy.join(', ')}`;
    }

    // HAVING clause
    if (options.having && options.having.length > 0) {
      const havingClause = this.buildWhereClause(options.having, params);
      sql += ` HAVING ${havingClause}`;
    }

    // ORDER BY clause
    if (options.orderBy && options.orderBy.length > 0) {
      sql += this.buildOrderByClause(options.orderBy);
    }

    // LIMIT/OFFSET (pagination)
    if (options.pagination) {
      const { limit, page } = options.pagination;
      const offset = (page - 1) * limit;
      sql += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    return { sql, params };
  }

  /**
   * Generate INSERT query
   */
  generateInsert(options: InsertQueryOptions): GeneratedQuery {
    this.resetParamCounter();
    const params: Record<string, any> = {};

    const columns = options.columns.join(', ');
    const placeholders = options.columns
      .map((col, index) => {
        const paramName = this.getNextParamName();
        params[paramName] = options.values[index];
        return this.getPlaceholder(paramName);
      })
      .join(', ');

    let sql = `INSERT INTO ${options.table} (${columns}) VALUES (${placeholders})`;

    // RETURNING clause (PostgreSQL)
    if (options.returning && options.returning.length > 0) {
      if (this.dbType === 'postgresql') {
        sql += ` RETURNING ${options.returning.join(', ')}`;
      }
    }

    return { sql, params };
  }

  /**
   * Generate UPDATE query
   */
  generateUpdate(options: UpdateQueryOptions): GeneratedQuery {
    this.resetParamCounter();
    const params: Record<string, any> = {};

    const setClauses = options.columns
      .map((col, index) => {
        const paramName = this.getNextParamName();
        params[paramName] = options.values[index];
        return `${col} = ${this.getPlaceholder(paramName)}`;
      })
      .join(', ');

    let sql = `UPDATE ${options.table} SET ${setClauses}`;

    // WHERE clause
    if (options.where && options.where.length > 0) {
      const whereClause = this.buildWhereClause(options.where, params);
      sql += ` WHERE ${whereClause}`;
    }

    // RETURNING clause (PostgreSQL)
    if (options.returning && options.returning.length > 0) {
      if (this.dbType === 'postgresql') {
        sql += ` RETURNING ${options.returning.join(', ')}`;
      }
    }

    return { sql, params };
  }

  /**
   * Generate DELETE query
   */
  generateDelete(options: DeleteQueryOptions): GeneratedQuery {
    this.resetParamCounter();
    const params: Record<string, any> = {};

    let sql = `DELETE FROM ${options.table}`;

    // WHERE clause
    if (options.where && options.where.length > 0) {
      const whereClause = this.buildWhereClause(options.where, params);
      sql += ` WHERE ${whereClause}`;
    }

    // RETURNING clause (PostgreSQL)
    if (options.returning && options.returning.length > 0) {
      if (this.dbType === 'postgresql') {
        sql += ` RETURNING ${options.returning.join(', ')}`;
      }
    }

    return { sql, params };
  }

  /**
   * Build WHERE clause from conditions
   */
  private buildWhereClause(
    conditions: WhereCondition[],
    params: Record<string, any>,
  ): string {
    return conditions
      .map((condition) => {
        const paramName = condition.paramName || this.getNextParamName();

        switch (condition.operator) {
          case QueryFilterOperator.EQUALS:
            params[paramName] = condition.value;
            return `${condition.column} = ${this.getPlaceholder(paramName)}`;

          case QueryFilterOperator.NOT_EQUALS:
            params[paramName] = condition.value;
            return `${condition.column} != ${this.getPlaceholder(paramName)}`;

          case QueryFilterOperator.GREATER_THAN:
            params[paramName] = condition.value;
            return `${condition.column} > ${this.getPlaceholder(paramName)}`;

          case QueryFilterOperator.GREATER_THAN_OR_EQUAL:
            params[paramName] = condition.value;
            return `${condition.column} >= ${this.getPlaceholder(paramName)}`;

          case QueryFilterOperator.LESS_THAN:
            params[paramName] = condition.value;
            return `${condition.column} < ${this.getPlaceholder(paramName)}`;

          case QueryFilterOperator.LESS_THAN_OR_EQUAL:
            params[paramName] = condition.value;
            return `${condition.column} <= ${this.getPlaceholder(paramName)}`;

          case QueryFilterOperator.LIKE:
            params[paramName] = `%${condition.value}%`;
            return `${condition.column} LIKE ${this.getPlaceholder(paramName)}`;

          case QueryFilterOperator.IN:
            if (Array.isArray(condition.value)) {
              const inParams = condition.value.map((val, idx) => {
                const inParamName = `${paramName}_${idx}`;
                params[inParamName] = val;
                return this.getPlaceholder(inParamName);
              });
              return `${condition.column} IN (${inParams.join(', ')})`;
            }
            return '';

          case QueryFilterOperator.BETWEEN:
            if (
              Array.isArray(condition.value) &&
              condition.value.length === 2
            ) {
              const param1 = `${paramName}_start`;
              const param2 = `${paramName}_end`;
              params[param1] = condition.value[0];
              params[param2] = condition.value[1];
              return `${condition.column} BETWEEN ${this.getPlaceholder(param1)} AND ${this.getPlaceholder(param2)}`;
            }
            return '';

          case QueryFilterOperator.IS_NULL:
            return condition.value === true
              ? `${condition.column} IS NULL`
              : `${condition.column} IS NOT NULL`;

          default:
            return '';
        }
      })
      .filter((clause) => clause !== '')
      .join(' AND ');
  }

  /**
   * Build JOIN clauses
   */
  private buildJoinClauses(joins: JoinClause[]): string {
    return joins
      .map((join) => {
        const tableName = join.alias
          ? `${join.table} ${join.alias}`
          : join.table;
        return ` ${join.type} JOIN ${tableName} ON ${join.on.left} = ${join.on.right}`;
      })
      .join('');
  }

  /**
   * Build ORDER BY clause
   */
  private buildOrderByClause(orderBy: OrderByClause[]): string {
    const clauses = orderBy
      .map((order) => `${order.column} ${order.order}`)
      .join(', ');
    return ` ORDER BY ${clauses}`;
  }

  /**
   * Get parameter placeholder based on database type
   */
  private getPlaceholder(paramName: string): string {
    if (this.dbType === 'postgresql') {
      return `$${paramName}`;
    } else {
      return `:${paramName}`;
    }
  }

  /**
   * Get next parameter name
   */
  private getNextParamName(): string {
    this.paramCounter++;
    return `param${this.paramCounter}`;
  }

  /**
   * Reset parameter counter
   */
  private resetParamCounter(): void {
    this.paramCounter = 0;
  }

  /**
   * Generate count query for pagination
   */
  generateCount(options: SelectQueryOptions): GeneratedQuery {
    this.resetParamCounter();
    const params: Record<string, any> = {};

    const tableName = options.alias
      ? `${options.table} ${options.alias}`
      : options.table;

    let sql = `SELECT COUNT(*) as total FROM ${tableName}`;

    // JOIN clauses
    if (options.joins && options.joins.length > 0) {
      sql += this.buildJoinClauses(options.joins);
    }

    // WHERE clause
    if (options.where && options.where.length > 0) {
      const whereClause = this.buildWhereClause(options.where, params);
      sql += ` WHERE ${whereClause}`;
    }

    return { sql, params };
  }
}
