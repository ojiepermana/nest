import { SetMetadata } from '@nestjs/common';
import { AuditAction } from './audit-log.interface';

/**
 * Audit Log Decorator Metadata Key
 */
export const AUDIT_LOG_METADATA = 'audit:log';

/**
 * Audit log decorator options
 */
export interface AuditLogOptions {
  /**
   * Action type (CREATE, UPDATE, DELETE, etc.)
   */
  action: AuditAction;

  /**
   * Entity type (e.g., 'users', 'products')
   */
  entityType: string;

  /**
   * Extract entity ID from method params
   * Can be:
   * - string: parameter name (e.g., 'id', 'userId')
   * - number: parameter index (e.g., 0, 1)
   * - function: custom extractor (params) => string
   */
  entityIdParam?: string | number | ((params: any[]) => string | undefined);

  /**
   * Extract old values from method params (for UPDATE/DELETE)
   * Can be:
   * - string: parameter name
   * - number: parameter index
   * - function: custom extractor
   */
  oldValuesParam?:
    | string
    | number
    | ((params: any[]) => Record<string, any> | undefined);

  /**
   * Extract new values from method return or params (for CREATE/UPDATE)
   * Can be:
   * - 'return': use method return value
   * - string: parameter name
   * - number: parameter index
   * - function: custom extractor
   */
  newValuesParam?:
    | 'return'
    | string
    | number
    | ((params: any[], result?: any) => Record<string, any> | undefined);

  /**
   * Tags for filtering
   */
  tags?: string[];

  /**
   * Custom metadata
   */
  metadata?: Record<string, any>;

  /**
   * Skip logging if condition is true
   */
  skipIf?: (params: any[], result?: any) => boolean;
}

/**
 * Decorator to automatically log audit trail for method calls
 *
 * @example
 * ```typescript
 * @AuditLog({
 *   action: 'CREATE',
 *   entityType: 'users',
 *   entityIdParam: 'return',
 *   newValuesParam: 'return',
 * })
 * async create(dto: CreateUserDto): Promise<User> {
 *   // ...
 * }
 *
 * @AuditLog({
 *   action: 'UPDATE',
 *   entityType: 'users',
 *   entityIdParam: 'id',
 *   oldValuesParam: (params) => this.getOldValues(params[0]),
 *   newValuesParam: 'updateDto',
 * })
 * async update(id: string, updateDto: UpdateUserDto): Promise<User> {
 *   // ...
 * }
 *
 * @AuditLog({
 *   action: 'DELETE',
 *   entityType: 'users',
 *   entityIdParam: 0,
 *   oldValuesParam: (params) => this.findOne(params[0]),
 * })
 * async delete(id: string): Promise<void> {
 *   // ...
 * }
 * ```
 */
export function AuditLog(options: AuditLogOptions): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    // Store metadata
    SetMetadata(AUDIT_LOG_METADATA, options)(target, propertyKey, descriptor);

    // Get original method
    const originalMethod = descriptor.value;

    // Replace with wrapped method
    descriptor.value = async function (...args: any[]) {
      const auditLogService = (this as any).auditLogService;

      if (!auditLogService) {
        console.warn(
          `@AuditLog decorator requires auditLogService to be injected in ${target.constructor.name}`,
        );
        return originalMethod.apply(this, args);
      }

      // Check skip condition
      if (options.skipIf && options.skipIf(args)) {
        return originalMethod.apply(this, args);
      }

      try {
        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Extract entity ID
        const entityId = extractEntityId(options.entityIdParam, args, result);

        // Extract old values
        const oldValues = await extractOldValues(options.oldValuesParam, args);

        // Extract new values
        const newValues = await extractNewValues(
          options.newValuesParam,
          args,
          result,
        );

        // Get user context (from request or this)
        const userContext = getUserContext(this);

        // Log audit entry
        await auditLogService.log({
          action: options.action,
          entity_type: options.entityType,
          entity_id: entityId,
          user_id: userContext.userId,
          user_name: userContext.userName,
          user_ip: userContext.userIp,
          user_agent: userContext.userAgent,
          old_values: oldValues,
          new_values: newValues,
          endpoint: userContext.endpoint,
          method: userContext.method,
          status: 'SUCCESS',
          tags: options.tags,
          metadata: options.metadata,
        });

        return result;
      } catch (error) {
        // Log failed operation
        const entityId = extractEntityId(options.entityIdParam, args);
        const userContext = getUserContext(this);

        await auditLogService
          .log({
            action: options.action,
            entity_type: options.entityType,
            entity_id: entityId,
            user_id: userContext.userId || 'system',
            status: 'FAILED',
            error_message:
              error instanceof Error ? error.message : String(error),
            tags: options.tags,
            metadata: options.metadata,
          })
          .catch(() => {
            // Silently fail audit logging to not break original operation
          });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Extract entity ID from parameters or result
 */
function extractEntityId(
  param: string | number | ((params: any[]) => string | undefined) | undefined,
  args: any[],
  result?: any,
): string | undefined {
  if (!param) {
    return undefined;
  }

  if (param === 'return' && result) {
    return result.id || result._id;
  }

  if (typeof param === 'string') {
    // Find named parameter
    const index = args.findIndex(
      (arg) => arg && typeof arg === 'object' && arg[param],
    );
    return index >= 0 ? args[index][param] : undefined;
  }

  if (typeof param === 'number') {
    return args[param];
  }

  if (typeof param === 'function') {
    return param(args);
  }

  return undefined;
}

/**
 * Extract old values from parameters
 */
async function extractOldValues(
  param:
    | string
    | number
    | ((params: any[]) => Record<string, any> | undefined)
    | undefined,
  args: any[],
): Promise<Record<string, any> | undefined> {
  if (!param) {
    return undefined;
  }

  if (typeof param === 'string') {
    const index = args.findIndex((arg) => arg && typeof arg === 'object');
    return index >= 0 ? args[index][param] : undefined;
  }

  if (typeof param === 'number') {
    return args[param];
  }

  if (typeof param === 'function') {
    const result = param(args);
    return result instanceof Promise ? await result : result;
  }

  return undefined;
}

/**
 * Extract new values from parameters or result
 */
async function extractNewValues(
  param:
    | 'return'
    | string
    | number
    | ((params: any[], result?: any) => Record<string, any> | undefined)
    | undefined,
  args: any[],
  result?: any,
): Promise<Record<string, any> | undefined> {
  if (!param) {
    return undefined;
  }

  if (param === 'return') {
    return result;
  }

  if (typeof param === 'string') {
    const index = args.findIndex((arg) => arg && typeof arg === 'object');
    return index >= 0 ? args[index][param] : undefined;
  }

  if (typeof param === 'number') {
    return args[param];
  }

  if (typeof param === 'function') {
    const value = param(args, result);
    return value instanceof Promise ? await value : value;
  }

  return undefined;
}

/**
 * Get user context from service instance or request
 */
function getUserContext(serviceInstance: any): {
  userId?: string;
  userName?: string;
  userIp?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
} {
  // Try to get from request (if available)
  const request = serviceInstance.request || serviceInstance.req;

  if (request) {
    return {
      userId: request.user?.id || request.user?.sub,
      userName: request.user?.name || request.user?.username,
      userIp: request.ip || request.connection?.remoteAddress,
      userAgent: request.headers?.['user-agent'],
      endpoint: request.path || request.url,
      method: request.method,
    };
  }

  // Fallback to service instance properties
  return {
    userId: serviceInstance.currentUserId || 'system',
    userName: serviceInstance.currentUserName,
  };
}
