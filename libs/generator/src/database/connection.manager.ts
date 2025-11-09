import { Pool as PgPool, PoolClient, PoolConfig } from 'pg';
import mysql, { PoolOptions, Pool, PoolConnection } from 'mysql2/promise';
import { DatabaseConfig } from '../interfaces/generator.interface';
import { Logger } from '../utils/logger.util';
import { retry } from '../utils/string.util';

/**
 * Database connection manager supporting PostgreSQL and MySQL
 */
export class DatabaseConnectionManager {
  private pgPool: PgPool | null = null;
  private mysqlPool: Pool | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Initialize connection pool based on database type
   */
  async connect(): Promise<void> {
    Logger.progress(`Connecting to ${this.config.type} database`);

    try {
      if (this.config.type === 'postgresql') {
        await this.connectPostgreSQL();
      } else if (this.config.type === 'mysql') {
        await this.connectMySQL();
      } else {
        throw new Error(`Unsupported database type: ${this.config.type}`);
      }

      Logger.success(
        `Connected to ${this.config.type} database at ${this.config.host}:${this.config.port}`,
      );
    } catch (error) {
      Logger.error('Failed to connect to database', error as Error);
      throw error;
    }
  }

  /**
   * Connect to PostgreSQL database
   */
  private async connectPostgreSQL(): Promise<void> {
    const poolConfig: PoolConfig = {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      max: this.config.maxConnections || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: this.config.connectionTimeoutMillis || 10000,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : undefined,
    };

    this.pgPool = new PgPool(poolConfig);

    // Test connection with retry
    await retry(async () => {
      const client = await this.pgPool!.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }
    });

    // Setup error handler
    this.pgPool.on('error', (err) => {
      Logger.error('Unexpected PostgreSQL pool error', err);
    });
  }

  /**
   * Connect to MySQL database
   */
  private async connectMySQL(): Promise<void> {
    const poolConfig: PoolOptions = {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      connectionLimit: this.config.maxConnections || 10,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : undefined,
    };

    this.mysqlPool = mysql.createPool(poolConfig);

    // Test connection with retry
    await retry(async () => {
      const connection = await this.mysqlPool!.getConnection();
      try {
        await connection.query('SELECT 1');
      } finally {
        connection.release();
      }
    });

    // Setup error handler
    this.mysqlPool.on('connection', (connection) => {
      connection.on('error', (err) => {
        Logger.error('MySQL connection error', err);
      });
    });
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<{
    type: string;
    version: string;
    pool: {
      total: number;
      idle: number;
      waiting: number;
    };
  }> {
    try {
      let version = 'Unknown';

      if (this.config.type === 'postgresql') {
        const result = await this.query<{ version: string }>(
          'SELECT version() as version',
        );
        version = result.rows?.[0]?.version || 'Unknown';
        Logger.info(`PostgreSQL version: ${version}`);
      } else if (this.config.type === 'mysql') {
        const result = await this.query<{ version: string }>(
          'SELECT version() as version',
        );
        version = result.rows?.[0]?.version || 'Unknown';
        Logger.info(`MySQL version: ${version}`);
      }

      const poolStats = this.getPoolStats();

      return {
        type: this.config.type.toUpperCase(),
        version,
        pool: poolStats,
      };
    } catch (error) {
      Logger.error('Connection test failed', error as Error);
      throw error;
    }
  }

  /**
   * Execute query (auto-detects database type)
   */
  async query<T = any>(
    text: string,
    params?: any[],
  ): Promise<{ rows: T[]; rowCount: number }> {
    if (this.config.type === 'postgresql') {
      return this.queryPostgreSQL<T>(text, params);
    } else if (this.config.type === 'mysql') {
      return this.queryMySQL<T>(text, params);
    } else {
      throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  /**
   * Execute PostgreSQL query
   */
  private async queryPostgreSQL<T>(
    text: string,
    params?: any[],
  ): Promise<{ rows: T[]; rowCount: number }> {
    if (!this.pgPool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    const result = await this.pgPool.query(text, params);
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount || 0,
    };
  }

  /**
   * Execute MySQL query
   */
  private async queryMySQL<T>(
    text: string,
    params?: any[],
  ): Promise<{ rows: T[]; rowCount: number }> {
    if (!this.mysqlPool) {
      throw new Error('MySQL pool not initialized');
    }

    // Convert PostgreSQL-style placeholders ($1, $2) to MySQL-style (?)
    const mysqlQuery = this.convertPlaceholders(text);

    const [rows] = await this.mysqlPool.query(mysqlQuery, params);
    return {
      rows: Array.isArray(rows) ? (rows as T[]) : [],
      rowCount: Array.isArray(rows) ? rows.length : 0,
    };
  }

  /**
   * Convert PostgreSQL placeholders ($1, $2) to MySQL placeholders (?)
   */
  private convertPlaceholders(query: string): string {
    let index = 1;
    return query.replace(/\$(\d+)/g, () => {
      index++;
      return '?';
    });
  }

  /**
   * Get client/connection for transaction
   */
  async getClient(): Promise<PoolClient | PoolConnection> {
    if (this.config.type === 'postgresql') {
      if (!this.pgPool) {
        throw new Error('PostgreSQL pool not initialized');
      }
      return await this.pgPool.connect();
    } else if (this.config.type === 'mysql') {
      if (!this.mysqlPool) {
        throw new Error('MySQL pool not initialized');
      }
      return await this.mysqlPool.getConnection();
    } else {
      throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  /**
   * Release client/connection
   */
  releaseClient(client: PoolClient | PoolConnection): void {
    if ('release' in client) {
      client.release();
    }
  }

  /**
   * Begin transaction
   */
  async beginTransaction(client: PoolClient | PoolConnection): Promise<void> {
    if (this.config.type === 'postgresql') {
      await (client as PoolClient).query('BEGIN');
    } else if (this.config.type === 'mysql') {
      await (client as PoolConnection).beginTransaction();
    }
  }

  /**
   * Commit transaction
   */
  async commitTransaction(client: PoolClient | PoolConnection): Promise<void> {
    if (this.config.type === 'postgresql') {
      await (client as PoolClient).query('COMMIT');
    } else if (this.config.type === 'mysql') {
      await (client as PoolConnection).commit();
    }
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(
    client: PoolClient | PoolConnection,
  ): Promise<void> {
    if (this.config.type === 'postgresql') {
      await (client as PoolClient).query('ROLLBACK');
    } else if (this.config.type === 'mysql') {
      await (client as PoolConnection).rollback();
    }
  }

  /**
   * Close all connections
   */
  async disconnect(): Promise<void> {
    Logger.info('Closing database connections...');

    try {
      if (this.pgPool) {
        await this.pgPool.end();
        this.pgPool = null;
      }

      if (this.mysqlPool) {
        await this.mysqlPool.end();
        this.mysqlPool = null;
      }

      Logger.success('Database connections closed');
    } catch (error) {
      Logger.error('Error closing database connections', error as Error);
      throw error;
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats(): {
    total: number;
    idle: number;
    waiting: number;
  } {
    if (this.config.type === 'postgresql' && this.pgPool) {
      return {
        total: this.pgPool.totalCount,
        idle: this.pgPool.idleCount,
        waiting: this.pgPool.waitingCount,
      };
    }

    // MySQL doesn't expose pool stats directly
    return {
      total: 0,
      idle: 0,
      waiting: 0,
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.pgPool !== null || this.mysqlPool !== null;
  }

  /**
   * Get database type
   */
  getDatabaseType(): string {
    return this.config.type;
  }
}
