import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database.module';
import { RBACModule } from '@ojiepermana/nest-rbac';
import { EntityModule } from './entity/entity.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get('DB_TYPE') || 'postgresql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        database: configService.get('DB_DATABASE'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        ssl: configService.get('DB_SSL') === 'true',
        pool: {
          min: parseInt(configService.get('DB_POOL_MIN') || '2'),
          max: parseInt(configService.get('DB_POOL_MAX') || '10'),
        },
      }),
      inject: [ConfigService, , EntityModule],
    }),
    RBACModule.register({
      adminRoles: ['admin', 'super_admin'],
      superAdminRole: 'super_admin',
      useGlobalGuards: true, // Enable guards for all endpoints
      cache: {
        enabled: true,
        ttl: 300, // 5 minutes
      },
    }),
    EntityModule,
  ],
  controllers: [],
  providers: [],
})
export class EntityServiceModule {}
