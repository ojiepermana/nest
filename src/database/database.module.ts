import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';

const databasePoolFactory = {
  provide: 'DATABASE_POOL',
  useFactory: () => {
    return new Pool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'nest_dev',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  },
};

@Global()
@Module({
  providers: [databasePoolFactory],
  exports: ['DATABASE_POOL'],
})
export class DatabaseModule {}
