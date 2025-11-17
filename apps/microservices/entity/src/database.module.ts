import { Module, Global, DynamicModule } from '@nestjs/common';
import { DatabaseConnectionManager } from '@ojiepermana/nest-generator/database';

export const DATABASE_POOL = 'DATABASE_POOL';

interface DatabaseConfig {
  type: 'postgresql' | 'mysql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pool?: {
    min?: number;
    max?: number;
  };
}

@Global()
@Module({})
export class DatabaseModule {
  static forRootAsync(options: {
    useFactory: (...args: never[]) => Promise<DatabaseConfig> | DatabaseConfig;
    inject?: unknown[];
  }): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: DATABASE_POOL,
          useFactory: async (...args: never[]) => {
            const config = await options.useFactory(...args);
            const manager = new DatabaseConnectionManager(config);
            await manager.connect();
            return manager; // Return the manager itself
          },
          inject: (options.inject || []) as never[],
        },
      ],
      exports: [DATABASE_POOL],
    };
  }
}
