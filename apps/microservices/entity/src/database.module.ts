import { Module, Global, DynamicModule } from '@nestjs/common';
import { DatabaseConnectionManager } from '@ojiepermana/nest-generator/database';

export const DATABASE_POOL = 'DATABASE_POOL';

@Global()
@Module({})
export class DatabaseModule {
  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<any> | any;
    inject?: any[];
  }): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: DATABASE_POOL,
          useFactory: async (...args: any[]) => {
            const config = await options.useFactory(...args);
            const manager = new DatabaseConnectionManager(config);
            await manager.connect();
            return manager; // Return the manager itself
          },
          inject: options.inject || [],
        },
      ],
      exports: [DATABASE_POOL],
    };
  }
}
