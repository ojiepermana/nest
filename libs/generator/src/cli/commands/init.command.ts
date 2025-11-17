/**
 * Init Command
 *
 * Interactive initialization command that:
 * 1. Prompts for architecture type, database config
 * 2. Tests database connection
 * 3. Creates metadata schema and tables
 * 4. Creates user.users table for audit tracking
 * 5. Generates config/generator/{architecture}.config.json
 * 6. Updates .env file
 */

import inquirer from 'inquirer';
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Logger } from '../../utils/logger.util';
import { DatabaseConnectionManager } from '../../database/connection.manager';
import { getSchemaForDatabase } from '../../database/schemas';
import type {
  DatabaseConfig,
  GeneratorConfig,
  ArchitectureType,
  DatabaseType,
} from '../../interfaces/generator.interface';

export class InitCommand {
  private config: Partial<GeneratorConfig> = {};

  async execute(options?: { architecture?: string; skipPrompts?: boolean }): Promise<void> {
    Logger.section('🚀 NestJS Generator Initialization');

    // Step 1: Architecture Selection
    await this.promptArchitecture(options);

    // Step 2: Database Configuration
    await this.promptDatabase();

    // Step 3: Test Connection
    await this.testConnection();

    // Step 4: Setup Metadata Schema
    await this.setupMetadataSchema();

    // Step 5: Setup User Table
    await this.setupUserTable();

    // Step 6: Microservices Gateway Selection
    if (this.config.architecture === 'microservices') {
      await this.promptGatewayApp();
    }

    // Step 7: Save Configuration
    await this.saveConfiguration();

    // Step 8: Summary
    this.showSummary();
  }

  private async promptArchitecture(options?: {
    architecture?: string;
    skipPrompts?: boolean;
  }): Promise<void> {
    // If architecture is provided via CLI flag, use it
    if (options?.architecture) {
      const validArchitectures = ['standalone', 'monorepo', 'microservices'];
      if (!validArchitectures.includes(options.architecture)) {
        Logger.error(
          `Invalid architecture type: ${options.architecture}`,
          new Error(`Must be one of: ${validArchitectures.join(', ')}`),
        );
        process.exit(1);
      }
      this.config.architecture = options.architecture as ArchitectureType;
      Logger.success(`Architecture: ${options.architecture} (from CLI flag)`);
      return;
    }

    // Otherwise, prompt interactively
    const { architecture } = await inquirer.prompt([
      {
        type: 'list',
        name: 'architecture',
        message: 'Select architecture type:',
        choices: [
          { name: 'Standalone - Single application', value: 'standalone' },
          {
            name: 'Monorepo - Multiple apps with shared libs',
            value: 'monorepo',
          },
          {
            name: 'Microservices - Distributed services with gateway',
            value: 'microservices',
          },
        ],
        default: 'standalone',
      },
    ]);

    this.config.architecture = architecture as ArchitectureType;
    Logger.success(`Architecture: ${architecture}`);
  }

  private async promptDatabase(): Promise<void> {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Select database type:',
        choices: ['PostgreSQL', 'MySQL'],
        default: 'PostgreSQL',
      },
      {
        type: 'input',
        name: 'host',
        message: 'Database host:',
        default: 'localhost',
      },
      {
        type: 'input',
        name: 'port',
        message: 'Database port:',
        default: (answers: { type: string }) => (answers.type === 'PostgreSQL' ? '5432' : '3306'),
      },
      {
        type: 'input',
        name: 'database',
        message: 'Database name:',
        default: 'myapp',
      },
      {
        type: 'input',
        name: 'username',
        message: 'Database username:',
        default: (answers: { type: string }) =>
          answers.type === 'PostgreSQL' ? 'postgres' : 'root',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Database password:',
        mask: '*',
      },
      {
        type: 'confirm',
        name: 'ssl',
        message: 'Enable SSL connection?',
        default: false,
      },
    ]);

    const dbType = answers.type === 'PostgreSQL' ? 'postgresql' : 'mysql';

    this.config.database = {
      type: dbType as DatabaseType,
      host: answers.host,
      port: parseInt(answers.port, 10),
      database: answers.database,
      username: answers.username,
      password: answers.password,
      ssl: answers.ssl,
      // Default pool settings
      pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
    };

    Logger.success(
      `Database: ${dbType.toUpperCase()} at ${answers.host}:${answers.port}/${answers.database}`,
    );
  }

  private async testConnection(): Promise<void> {
    Logger.step('Testing database connection...');

    const connectionManager = new DatabaseConnectionManager(this.config.database as DatabaseConfig);

    try {
      await connectionManager.connect();
      const result = await connectionManager.testConnection();

      Logger.success(`Connected to ${result.type} ${result.version}`);
      Logger.info(
        `Connection pool: ${result.pool.total} total, ${result.pool.idle} idle, ${result.pool.waiting} waiting`,
      );

      // Validate database version
      Logger.step('Validating database version...');
      const validation = await connectionManager.validateDatabaseVersion();

      if (!validation.valid) {
        Logger.warn('\n⚠️  Database version does not meet minimum requirements!');
        Logger.warn(`   Current: ${validation.version}`);
        Logger.warn(`   Minimum: ${validation.minimumVersion}`);

        if (validation.warnings.length > 0) {
          validation.warnings.forEach((warning) => Logger.warn(`   ${warning}`));
        }

        const { continueAnyway } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueAnyway',
            message: 'Continue with incompatible database version?',
            default: false,
          },
        ]);

        if (!continueAnyway) {
          await connectionManager.disconnect();
          throw new Error('Database version requirement not met. Please upgrade your database.');
        }

        Logger.warn('Continuing with potentially incompatible database version...');
      }

      await connectionManager.disconnect();
    } catch (error) {
      Logger.error('Database connection failed', error);
      throw new Error('Cannot connect to database. Please check your credentials and try again.');
    }
  }

  private async setupMetadataSchema(): Promise<void> {
    Logger.section('📋 Setting up metadata schema');

    const connectionManager = new DatabaseConnectionManager(this.config.database as DatabaseConfig);

    try {
      await connectionManager.connect();

      // Check if metadata schema exists
      const schemaExists = await this.checkMetadataSchemaExists(connectionManager);

      if (schemaExists) {
        Logger.info('✓ Metadata schema already exists');

        // Check if tables exist
        const tablesExist = await this.checkMetadataTablesExist(connectionManager);

        if (tablesExist) {
          Logger.info(
            '✓ Metadata tables already exist (table_metadata, column_metadata, generated_files)',
          );

          const { recreate } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'recreate',
              message: '⚠️  Recreate metadata schema? (This will drop existing data)',
              default: false,
            },
          ]);

          if (!recreate) {
            Logger.success('Using existing metadata schema and tables');
            await connectionManager.disconnect();
            return;
          }

          // Drop existing schema
          await this.dropMetadataSchema(connectionManager);
        } else {
          Logger.warn('Metadata schema exists but tables are missing. Creating tables...');
        }
      }

      // Create metadata schema and tables
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: schemaExists
            ? 'Create missing metadata tables?'
            : 'Create metadata schema and tables?',
          default: true,
        },
      ]);

      if (!confirm) {
        Logger.warn('Skipping metadata schema setup');
        await connectionManager.disconnect();
        return;
      }

      Logger.step('Creating metadata schema...');

      const schemaSQL = getSchemaForDatabase(this.config.database!.type);
      await connectionManager.query(schemaSQL);

      Logger.success('Metadata schema created successfully');
      Logger.info(
        'Created tables: meta.table_metadata, meta.column_metadata, meta.generated_files',
      );

      if (this.config.database!.type === 'postgresql') {
        Logger.info('Created function: meta.uuid_generate_v7()');
      }

      await connectionManager.disconnect();
    } catch (error) {
      Logger.error('Failed to setup metadata schema', error);
      throw error;
    }
  }

  private async checkMetadataTablesExist(
    connectionManager: DatabaseConnectionManager,
  ): Promise<boolean> {
    try {
      const dbType = this.config.database!.type;
      const requiredTables = ['table_metadata', 'column_metadata', 'generated_files'];

      if (dbType === 'postgresql') {
        const result = await connectionManager.query<{ count: number }>(
          `SELECT COUNT(*) as count 
           FROM information_schema.tables 
           WHERE table_schema = 'meta' 
           AND table_name IN ('table_metadata', 'column_metadata', 'generated_files')`,
        );
        // Check if all 3 required tables exist (there might be additional tables, which is fine)
        return result.rows[0]?.count >= 3;
      } else {
        const result = await connectionManager.query<{ count: number }>(
          `SELECT COUNT(*) as count 
           FROM information_schema.tables 
           WHERE table_schema = 'meta' 
           AND table_name IN ('table_metadata', 'column_metadata', 'generated_files')`,
        );
        return (result[0] as unknown as { count: number }).count >= 3;
      }
    } catch {
      return false;
    }
  }

  private async checkMetadataSchemaExists(
    connectionManager: DatabaseConnectionManager,
  ): Promise<boolean> {
    try {
      const dbType = this.config.database!.type;

      if (dbType === 'postgresql') {
        const result = await connectionManager.query<{ exists: boolean }>(
          "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'meta') as exists",
        );
        return result.rows[0]?.exists || false;
      } else {
        // MySQL: check if database exists
        const result = await connectionManager.query<{ count: number }>(
          "SELECT COUNT(*) as count FROM information_schema.schemata WHERE schema_name = 'meta'",
        );
        return (result[0] as unknown as { count: number }).count > 0;
      }
    } catch {
      return false;
    }
  }

  private async dropMetadataSchema(connectionManager: DatabaseConnectionManager): Promise<void> {
    const dbType = this.config.database!.type;

    if (dbType === 'postgresql') {
      await connectionManager.query('DROP SCHEMA IF EXISTS meta CASCADE');
    } else {
      await connectionManager.query('DROP DATABASE IF EXISTS meta');
    }

    Logger.warn('Existing metadata schema dropped');
  }

  private async dropUserTable(connectionManager: DatabaseConnectionManager): Promise<void> {
    const dbType = this.config.database!.type;

    if (dbType === 'postgresql') {
      await connectionManager.query('DROP TABLE IF EXISTS "user"."users" CASCADE');
    } else {
      await connectionManager.query('DROP TABLE IF EXISTS `user`.`users`');
    }

    Logger.warn('Existing user table dropped');
  }

  private async setupUserTable(): Promise<void> {
    Logger.section('👤 Setting up user table');

    const connectionManager = new DatabaseConnectionManager(this.config.database as DatabaseConfig);

    try {
      await connectionManager.connect();

      // Check if user schema exists
      const schemaExists = await this.checkUserSchemaExists(connectionManager);

      // Check if user.users table exists
      const tableExists = await this.checkUserTableExists(connectionManager);

      if (schemaExists && tableExists) {
        Logger.success('✓ User schema and table already exist');
        await connectionManager.disconnect();
        return;
      }

      if (schemaExists && !tableExists) {
        Logger.info('✓ User schema exists');
        Logger.warn('User table does not exist. Creating table...');
      }

      const { createUserTable } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createUserTable',
          message: tableExists
            ? 'User table already exists. Recreate?'
            : 'Create basic users table? (Required for created_by/updated_by tracking)',
          default: !tableExists,
        },
      ]);

      if (!createUserTable) {
        Logger.warn('Skipping user table creation');
        if (!tableExists) {
          Logger.warn('You will need to create user.users table manually for audit tracking');
        }
        await connectionManager.disconnect();
        return;
      }

      if (tableExists) {
        Logger.step('Dropping existing user table...');
        await this.dropUserTable(connectionManager);
      }

      await this.createUserTable(connectionManager);

      Logger.success('User table created successfully');
      Logger.info('Created table: user.users');
      Logger.info('Inserted system user (id: 00000000-0000-0000-0000-000000000000)');

      await connectionManager.disconnect();
    } catch (error) {
      Logger.error('Failed to setup user table', error);
      // Don't throw - user table is optional
      Logger.warn('Continuing without user table. You can create it manually later.');
    }
  }

  private async checkUserSchemaExists(
    connectionManager: DatabaseConnectionManager,
  ): Promise<boolean> {
    try {
      const dbType = this.config.database!.type;

      if (dbType === 'postgresql') {
        const result = await connectionManager.query<{ exists: boolean }>(
          "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'user') as exists",
        );
        return result.rows[0]?.exists || false;
      } else {
        const result = await connectionManager.query<{ count: number }>(
          "SELECT COUNT(*) as count FROM information_schema.schemata WHERE schema_name = 'user'",
        );
        return (result[0] as unknown as { count: number }).count > 0;
      }
    } catch {
      return false;
    }
  }

  private async checkUserTableExists(
    connectionManager: DatabaseConnectionManager,
  ): Promise<boolean> {
    try {
      const dbType = this.config.database!.type;

      if (dbType === 'postgresql') {
        const result = await connectionManager.query<{ exists: boolean }>(
          "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'user' AND table_name = 'users') as exists",
        );
        return result.rows[0]?.exists || false;
      } else {
        const result = await connectionManager.query<{ count: number }>(
          "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'user' AND table_name = 'users'",
        );
        return (result[0] as unknown as { count: number }).count > 0;
      }
    } catch {
      return false;
    }
  }

  private async createUserTable(connectionManager: DatabaseConnectionManager): Promise<void> {
    const dbType = this.config.database!.type;

    if (dbType === 'postgresql') {
      // PostgreSQL user table
      await connectionManager.query('CREATE SCHEMA IF NOT EXISTS "user"');

      await connectionManager.query(`
        CREATE TABLE IF NOT EXISTS "user"."users" (
          id UUID PRIMARY KEY DEFAULT meta.uuid_generate_v7(),
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_by UUID REFERENCES "user"."users"(id),
          updated_by UUID REFERENCES "user"."users"(id)
        )
      `);

      // Insert system user
      await connectionManager.query(`
        INSERT INTO "user"."users" (id, username, email, full_name, is_active, created_by, updated_by)
        VALUES (
          '00000000-0000-0000-0000-000000000000',
          'system',
          'system@generator.local',
          'System User',
          true,
          '00000000-0000-0000-0000-000000000000',
          '00000000-0000-0000-0000-000000000000'
        )
        ON CONFLICT (id) DO NOTHING
      `);

      // Create updated_at trigger
      await connectionManager.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trigger_users_updated_at
          BEFORE UPDATE ON "user"."users"
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);
    } else {
      // MySQL user table
      await connectionManager.query('CREATE DATABASE IF NOT EXISTS `user`');
      await connectionManager.query('USE `user`');

      await connectionManager.query(`
        CREATE TABLE IF NOT EXISTS users (
          id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          created_by CHAR(36),
          updated_by CHAR(36),
          INDEX idx_username (username),
          INDEX idx_email (email),
          INDEX idx_is_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Insert system user
      await connectionManager.query(`
        INSERT INTO users (id, username, email, full_name, is_active, created_by, updated_by)
        VALUES (
          '00000000-0000-0000-0000-000000000000',
          'system',
          'system@generator.local',
          'System User',
          true,
          '00000000-0000-0000-0000-000000000000',
          '00000000-0000-0000-0000-000000000000'
        )
        ON DUPLICATE KEY UPDATE username = 'system'
      `);
    }
  }

  private async promptGatewayApp(): Promise<void> {
    const { gatewayApp } = await inquirer.prompt([
      {
        type: 'input',
        name: 'gatewayApp',
        message: 'Gateway app name (in apps/ directory):',
        default: 'gateway',
      },
    ]);

    if (!this.config.microservices) {
      this.config.microservices = { services: [] };
    }

    this.config.microservices.gatewayApp = gatewayApp;
    Logger.success(`Gateway app: ${gatewayApp}`);
  }

  private async saveConfiguration(): Promise<void> {
    Logger.section('💾 Saving configuration');

    // Create config WITHOUT sensitive data (password)
    const safeConfig: GeneratorConfig = {
      architecture: this.config.architecture || 'standalone',
      database: {
        type: this.config.database!.type,
        host: '${DB_HOST}',
        port: '${DB_PORT}' as any, // Will be read from env
        database: '${DB_DATABASE}',
        username: '${DB_USERNAME}',
        password: '${DB_PASSWORD}',
        ssl: '${DB_SSL}' as any, // Will be read from env
        pool: {
          min: '${DB_POOL_MIN}' as any,
          max: '${DB_POOL_MAX}' as any,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      },
      features: {
        swagger: true,
        caching: false,
        fileUpload: false,
        export: true,
        search: false,
        audit: true,
        rbac: false,
        notifications: false,
      },
      microservices: this.config.microservices,
    };

    // Always save config at project root (find root by looking for package.json with workspace)
    const projectRoot = this.findProjectRoot();
    const architecture = this.config.architecture || 'standalone';
    const configDir = join(projectRoot, 'config', 'generator');
    const configPath = join(configDir, `${architecture}.config.json`);

    // Create config/generator directory if it doesn't exist
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
      Logger.info(`Created directory: ${configDir}`);
    }

    writeFileSync(configPath, JSON.stringify(safeConfig, null, 2), 'utf-8');
    Logger.success(`Configuration saved: ${configPath}`);
    Logger.info('💡 Database credentials are stored in .env (not in config file)');

    // Update .env at project root
    await this.updateEnvFile(projectRoot);
  }

  /**
   * Find project root by looking for package.json
   * Walks up directory tree until package.json is found
   */
  private findProjectRoot(): string {
    let currentDir = process.cwd();
    const maxDepth = 10; // Prevent infinite loop
    let depth = 0;

    while (depth < maxDepth) {
      const packageJsonPath = join(currentDir, 'package.json');

      if (existsSync(packageJsonPath)) {
        // Check if it's a workspace root (has workspaces or apps folder)
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

        // If has workspaces or is root level package.json, use it
        if (packageJson.workspaces || existsSync(join(currentDir, 'apps'))) {
          return currentDir;
        }

        // If standalone app (no parent with apps folder), use current
        const parentDir = join(currentDir, '..');
        if (!existsSync(join(parentDir, 'apps'))) {
          return currentDir;
        }
      }

      // Move up one directory
      const parentDir = join(currentDir, '..');
      if (parentDir === currentDir) {
        // Reached filesystem root
        break;
      }
      currentDir = parentDir;
      depth++;
    }

    // Fallback to current directory
    return process.cwd();
  }

  private async updateEnvFile(projectRoot: string): Promise<void> {
    const envPath = join(projectRoot, '.env');
    const db = this.config.database!;

    const envContent = `
# Database Configuration (Generated by nest-generator init)
DB_TYPE=${db.type}
DB_HOST=${db.host}
DB_PORT=${db.port}
DB_DATABASE=${db.database}
DB_USERNAME=${db.username}
DB_PASSWORD=${db.password}
DB_SSL=${db.ssl || false}

# Connection Pool
DB_POOL_MIN=${db.pool?.min || 2}
DB_POOL_MAX=${db.pool?.max || 10}
`.trim();

    if (existsSync(envPath)) {
      const existing = readFileSync(envPath, 'utf-8');

      // Check if DB config already exists
      if (existing.includes('DB_TYPE=') || existing.includes('DB_HOST=')) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: '⚠️  .env file already contains database configuration. Overwrite?',
            default: false,
          },
        ]);

        if (!overwrite) {
          Logger.warn('Skipped .env update. Please update database configuration manually.');
          return;
        }
      }

      // Append to existing .env
      writeFileSync(envPath, `${existing}\n\n${envContent}`, 'utf-8');
    } else {
      writeFileSync(envPath, envContent, 'utf-8');
    }

    Logger.success('Environment file updated: .env');
  }

  private showSummary(): void {
    Logger.section('✅ Setup Complete!');

    Logger.box([
      'Next steps:',
      '',
      '1. Populate metadata tables:',
      '   INSERT INTO meta.table_metadata (schema_name, table_name, ...) VALUES (...);',
      '   INSERT INTO meta.column_metadata (table_metadata_id, column_name, ...) VALUES (...);',
      '',
      '2. Generate your first module:',
      '   nest-generator generate <schema>.<table>',
      '',
      '3. View generated files in:',
      `   ${this.config.architecture === 'microservices' ? 'apps/<service>/src/modules/' : 'src/modules/'}`,
      '',
      'For help: nest-generator --help',
    ]);

    Logger.success('Happy coding! 🚀');
  }
}
