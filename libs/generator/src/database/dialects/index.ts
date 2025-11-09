/**
 * Dialect Factory
 *
 * Creates appropriate database dialect based on database type
 */

import type { DatabaseType } from '../../types/architecture.type';
import type { IDatabaseDialect } from '../../interfaces/base.interface';
import { PostgresDialect } from './postgres.dialect';
import { MySQLDialect } from './mysql.dialect';

export class DialectFactory {
  /**
   * Create dialect instance for specified database type
   */
  static create(databaseType: DatabaseType): IDatabaseDialect {
    switch (databaseType) {
      case 'postgresql':
        return new PostgresDialect();
      case 'mysql':
        return new MySQLDialect();
      default: {
        const _exhaustive: never = databaseType;
        throw new Error(`Unsupported database type: ${String(_exhaustive)}`);
      }
    }
  }

  /**
   * Create dialect from database config
   */
  static fromConfig(config: { type: DatabaseType }): IDatabaseDialect {
    return DialectFactory.create(config.type);
  }
}

// Export dialect implementations only (not the interface, it's already in base.interface)
export * from './postgres.dialect';
export * from './mysql.dialect';
