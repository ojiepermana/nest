import { Module, Global, DynamicModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { RBACService } from './rbac.service';
import { RBACRepository } from './rbac.repository';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { RBACServiceConfig } from './interfaces';

/**
 * RBAC Module Configuration Options
 */
export interface RBACModuleOptions {
  /**
   * Cache configuration
   */
  cache?: {
    enabled?: boolean;
    ttl?: number; // seconds
    prefix?: string;
  };

  /**
   * Admin role names (users with these roles have all permissions)
   */
  adminRoles?: string[];

  /**
   * Super admin role name (user with this role bypasses all checks)
   */
  superAdminRole?: string;

  /**
   * Default role expiration in days
   */
  defaultExpiration?: number;

  /**
   * Enable global guards (apply to all routes)
   */
  useGlobalGuards?: boolean;
}

/**
 * RBAC Module
 *
 * Provides Role-Based Access Control functionality
 * Can be imported as global module or feature module
 */
@Global()
@Module({})
export class RBACModule {
  /**
   * Register RBAC module with configuration
   */
  static register(options: RBACModuleOptions = {}): DynamicModule {
    const config: RBACServiceConfig = {
      cache: {
        enabled: options.cache?.enabled ?? true,
        ttl: options.cache?.ttl ?? 300,
        prefix: options.cache?.prefix ?? 'rbac',
      },
      adminRoles: options.adminRoles ?? ['admin', 'super_admin'],
      superAdminRole: options.superAdminRole ?? 'super_admin',
      defaultExpiration: options.defaultExpiration,
    };

    const providers = [
      {
        provide: 'RBAC_CONFIG',
        useValue: config,
      },
      RBACRepository,
      RBACService,
      PermissionsGuard,
      RolesGuard,
    ];

    // Add global guards if enabled
    if (options.useGlobalGuards) {
      providers.push(
        {
          provide: 'APP_GUARD',
          useClass: RolesGuard,
        },
        {
          provide: 'APP_GUARD',
          useClass: PermissionsGuard,
        },
      );
    }

    return {
      module: RBACModule,
      imports: [
        CacheModule.register({
          ttl: config.cache?.ttl ? config.cache.ttl * 1000 : 300000,
          max: 1000,
        }),
      ],
      providers,
      exports: [RBACService, RBACRepository, PermissionsGuard, RolesGuard],
    };
  }

  /**
   * Register RBAC module for async configuration
   */
  static registerAsync(options: {
    useFactory: (
      ...args: any[]
    ) => Promise<RBACModuleOptions> | RBACModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: RBACModule,
      imports: [CacheModule.register()],
      providers: [
        {
          provide: 'RBAC_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        RBACRepository,
        RBACService,
        PermissionsGuard,
        RolesGuard,
      ],
      exports: [RBACService, RBACRepository, PermissionsGuard, RolesGuard],
    };
  }
}
