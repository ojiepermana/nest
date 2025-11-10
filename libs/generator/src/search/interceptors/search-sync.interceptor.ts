/**
 * Auto-Sync Interceptor
 *
 * Automatically syncs CRUD operations to search index
 * Intercepts create, update, delete operations and updates search index
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SearchService } from '../search.service';
import { getSearchableConfig } from '../decorators/searchable.decorator';

export interface SyncOptions {
  /**
   * Model name for search service
   */
  modelName: string;

  /**
   * ID field name (default: 'id')
   */
  idField?: string;

  /**
   * Operation type: 'create' | 'update' | 'delete'
   */
  operation: 'create' | 'update' | 'delete';

  /**
   * Enable async sync (non-blocking)
   */
  async?: boolean;
}

/**
 * Decorator to enable auto-sync for a method
 *
 * @example
 * ```typescript
 * @AutoSync({ modelName: 'Product', operation: 'create' })
 * async create(@Body() dto: CreateProductDto) {
 *   return this.productService.create(dto);
 * }
 * ```
 */
export function AutoSync(options: SyncOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Get SearchService from context (should be injected)
      const searchService = (this as any).searchService as SearchService;

      if (!searchService) {
        Logger.warn(
          `SearchService not found in ${target.constructor.name}. Auto-sync disabled.`,
          'AutoSync',
        );
        return result;
      }

      // Perform sync based on operation
      try {
        const idField = options.idField || 'id';

        if (options.async) {
          // Non-blocking async sync
          setImmediate(() => {
            this.performSync(searchService, options, result, idField).catch((error: Error) => {
              Logger.error(`Async sync failed: ${error.message}`, 'AutoSync');
            });
          });
        } else {
          // Blocking sync
          await this.performSync(searchService, options, result, idField);
        }
      } catch (error: unknown) {
        Logger.error(`Auto-sync failed: ${(error as Error).message}`, 'AutoSync');
      }

      return result;
    };

    // Helper method for sync
    (descriptor.value as any).performSync = async function (
      searchService: SearchService,
      opts: SyncOptions,
      data: any,
      idField: string,
    ) {
      if (!data) return;

      switch (opts.operation) {
        case 'create': {
          if (Array.isArray(data)) {
            await searchService.importSearchable(
              opts.modelName,
              data as { id: string; data: any }[],
              idField,
            );
          } else {
            await searchService.makeSearchable(opts.modelName, data, String(data[idField]));
          }
          break;
        }

        case 'update': {
          await searchService.updateSearchable(
            opts.modelName,
            data as Partial<any>,
            String(data[idField]),
          );
          break;
        }

        case 'delete': {
          const id = typeof data === 'string' ? data : String(data[idField]);
          await searchService.removeFromSearch(opts.modelName, id);
          break;
        }
      }
    };

    return descriptor;
  };
}

/**
 * Interceptor for automatic search sync
 */
@Injectable()
export class SearchSyncInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SearchSyncInterceptor.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly modelName: string,
    private readonly options?: {
      idField?: string;
      async?: boolean;
      onCreate?: boolean;
      onUpdate?: boolean;
      onDelete?: boolean;
    },
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const idField = this.options?.idField || 'id';
    const asyncSync = this.options?.async ?? true;

    return next.handle().pipe(
      tap(async (data) => {
        if (!data) return;

        try {
          // Determine operation from HTTP method
          let operation: 'create' | 'update' | 'delete' | null = null;

          if (method === 'POST' && this.options?.onCreate !== false) {
            operation = 'create';
          } else if ((method === 'PUT' || method === 'PATCH') && this.options?.onUpdate !== false) {
            operation = 'update';
          } else if (method === 'DELETE' && this.options?.onDelete !== false) {
            operation = 'delete';
          }

          if (!operation) return;

          // Perform sync
          const syncFn = async () => {
            switch (operation) {
              case 'create': {
                if (Array.isArray(data)) {
                  await this.searchService.importSearchable(
                    this.modelName,
                    data as { id: string; data: any }[],
                    idField,
                  );
                } else {
                  await this.searchService.makeSearchable(
                    this.modelName,
                    data,
                    String(data[idField]),
                  );
                }
                break;
              }

              case 'update': {
                await this.searchService.updateSearchable(
                  this.modelName,
                  data as Partial<any>,
                  String(data[idField]),
                );
                break;
              }

              case 'delete': {
                const id = typeof data === 'string' ? data : String(data[idField]);
                await this.searchService.removeFromSearch(this.modelName, id);
                break;
              }
            }
          };

          if (asyncSync) {
            // Non-blocking
            setImmediate(() => {
              syncFn().catch((error: Error) => {
                this.logger.error(`Async sync failed: ${error.message}`);
              });
            });
          } else {
            // Blocking
            await syncFn();
          }
        } catch (error: unknown) {
          this.logger.error(`Search sync failed: ${(error as Error).message}`);
        }
      }),
    );
  }
}

/**
 * Factory to create SearchSyncInterceptor
 */
export function createSearchSyncInterceptor(
  searchService: SearchService,
  modelName: string,
  options?: {
    idField?: string;
    async?: boolean;
    onCreate?: boolean;
    onUpdate?: boolean;
    onDelete?: boolean;
  },
) {
  return new SearchSyncInterceptor(searchService, modelName, options);
}
