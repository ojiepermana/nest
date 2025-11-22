import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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

  /**
   * Make module global (default: true)
   */
  isGlobal?: boolean;
}

/**
 * RBAC Module
 *
 * Provides Role-Based Access Control functionality
 * Global by default for easy access across the application
 *
 * @example
 * // Simple registration (global by default)
 * RBACModule.register({
 *   adminRoles: ['admin'],
 *   useGlobalGuards: true
 * })
 *
 * @example
 * // Non-global registration
 * RBACModule.register({
 *   adminRoles: ['admin'],
 *   isGlobal: false
 * })
 *
 * @example
 * // Async registration with ConfigService
 * RBACModule.registerAsync({
 *   useFactory: (config: ConfigService) => ({
 *     adminRoles: config.get('ADMIN_ROLES'),
 *     cache: { ttl: config.get('CACHE_TTL') }
 *   }),
 *   inject: [ConfigService]
 * })
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

    const providers: Provider[] = [
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
          provide: APP_GUARD,
          useClass: RolesGuard,
        },
        {
          provide: APP_GUARD,
          useClass: PermissionsGuard,
        },
      );
    }

    return {
      module: RBACModule,
      global: options.isGlobal !== false, // Default to global
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
    useFactory: (...args: any[]) => Promise<RBACModuleOptions> | RBACModuleOptions;
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
