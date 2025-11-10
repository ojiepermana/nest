import { Injectable } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogEntry, AuditLogFilter, AuditAction, AuditStatus } from './audit-log.interface';

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Advanced filter options
 */
export interface AdvancedAuditFilter extends AuditLogFilter {
  // Text search
  search?: string; // Search in entity_type, user_name, etc.

  // Field-specific search
  changed_field?: string; // Filter by changed field name

  // Grouping
  group_by?: 'entity_type' | 'user_id' | 'action' | 'date';

  // Sorting
  sort_by?: 'created_at' | 'action' | 'entity_type' | 'user_id';
  sort_order?: 'ASC' | 'DESC';

  // Rollback status
  include_rolled_back?: boolean;
  only_rolled_back?: boolean;

  // Date shortcuts
  today?: boolean;
  yesterday?: boolean;
  this_week?: boolean;
  this_month?: boolean;
  last_7_days?: boolean;
  last_30_days?: boolean;

  // User filters
  exclude_users?: string[];
  include_users?: string[];
}

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'csv' | 'excel';

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  filter?: AdvancedAuditFilter;
  include_metadata?: boolean;
  filename?: string;
}

/**
 * Grouped result
 */
export interface GroupedResult {
  group: string;
  count: number;
  items?: AuditLogEntry[];
}

/**
 * AuditQueryService
 *
 * Advanced query and export service for audit logs
 * Provides filtering, pagination, grouping, and export functionality
 *
 * @example
 * ```typescript
 * // Paginated query
 * const result = await queryService.query(
 *   { entity_type: 'users', action: 'UPDATE' },
 *   1,
 *   20
 * );
 *
 * // Search
 * const results = await queryService.search('john@example.com');
 *
 * // Export to CSV
 * const csv = await queryService.export({
 *   format: 'csv',
 *   filter: { last_7_days: true }
 * });
 * ```
 */
@Injectable()
export class AuditQueryService {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Query logs with pagination
   */
  async query(
    filter: AdvancedAuditFilter,
    page = 1,
    limit = 50,
  ): Promise<PaginatedResult<AuditLogEntry>> {
    // Apply advanced filters
    const enhancedFilter = this.applyAdvancedFilters(filter);

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get logs with pagination
    const logs = await this.auditLogService.find({
      ...enhancedFilter,
      limit,
      offset,
    });

    // Get total count
    const allLogs = await this.auditLogService.find(enhancedFilter);
    const total = allLogs.length;

    // Calculate pagination metadata
    const total_pages = Math.ceil(total / limit);
    const has_next = page < total_pages;
    const has_prev = page > 1;

    return {
      data: logs,
      total,
      page,
      limit,
      total_pages,
      has_next,
      has_prev,
    };
  }

  /**
   * Search logs by text
   */
  async search(searchText: string, page = 1, limit = 50): Promise<PaginatedResult<AuditLogEntry>> {
    const filter: AdvancedAuditFilter = {
      search: searchText,
    };

    return this.query(filter, page, limit);
  }

  /**
   * Get logs for today
   */
  async getToday(): Promise<AuditLogEntry[]> {
    return this.auditLogService.find(this.applyAdvancedFilters({ today: true }));
  }

  /**
   * Get logs for this week
   */
  async getThisWeek(): Promise<AuditLogEntry[]> {
    return this.auditLogService.find(this.applyAdvancedFilters({ this_week: true }));
  }

  /**
   * Get logs for last N days
   */
  async getLastNDays(days: number): Promise<AuditLogEntry[]> {
    const start_date = new Date();
    start_date.setDate(start_date.getDate() - days);

    return this.auditLogService.find({ start_date });
  }

  /**
   * Group logs by field
   */
  async groupBy(
    groupField: 'entity_type' | 'user_id' | 'action' | 'date',
    filter?: AdvancedAuditFilter,
  ): Promise<GroupedResult[]> {
    const enhancedFilter = filter ? this.applyAdvancedFilters(filter) : {};

    const logs = await this.auditLogService.find(enhancedFilter);

    // Group logs
    const groups = new Map<string, AuditLogEntry[]>();

    logs.forEach((log) => {
      let key: string;

      switch (groupField) {
        case 'entity_type':
          key = log.entity_type;
          break;
        case 'user_id':
          key = log.user_id;
          break;
        case 'action':
          key = log.action;
          break;
        case 'date':
          key = log.created_at.toISOString().split('T')[0];
          break;
        default:
          key = 'unknown';
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(log);
    });

    // Convert to result array
    const results: GroupedResult[] = [];
    groups.forEach((items, group) => {
      results.push({
        group,
        count: items.length,
        items,
      });
    });

    // Sort by count descending
    results.sort((a, b) => b.count - a.count);

    return results;
  }

  /**
   * Get activity timeline
   */
  async getTimeline(filter?: AdvancedAuditFilter): Promise<GroupedResult[]> {
    return this.groupBy('date', filter);
  }

  /**
   * Get most active users
   */
  async getMostActiveUsers(limit = 10): Promise<GroupedResult[]> {
    const grouped = await this.groupBy('user_id');
    return grouped.slice(0, limit);
  }

  /**
   * Get most modified entities
   */
  async getMostModifiedEntities(limit = 10): Promise<GroupedResult[]> {
    const grouped = await this.groupBy('entity_type');
    return grouped.slice(0, limit);
  }

  /**
   * Get changes to specific field
   */
  async getFieldChanges(fieldName: string, filter?: AdvancedAuditFilter): Promise<AuditLogEntry[]> {
    const enhancedFilter = filter ? this.applyAdvancedFilters(filter) : {};

    const logs = await this.auditLogService.find(enhancedFilter);

    // Filter logs that have changes to the specified field
    return logs.filter((log) => log.changes?.some((change) => change.field === fieldName));
  }

  /**
   * Compare two states (for diff view)
   */
  async compareStates(
    logId1: string,
    logId2: string,
  ): Promise<{
    log1: AuditLogEntry | null;
    log2: AuditLogEntry | null;
    differences: Array<{
      field: string;
      value1: any;
      value2: any;
      changed: boolean;
    }>;
  }> {
    const log1 = await this.auditLogService.findById(logId1);
    const log2 = await this.auditLogService.findById(logId2);

    if (!log1 || !log2) {
      return { log1, log2, differences: [] };
    }

    // Get all unique fields
    const fields = new Set<string>();
    if (log1.new_values) {
      Object.keys(log1.new_values).forEach((k) => fields.add(k));
    }
    if (log2.new_values) {
      Object.keys(log2.new_values).forEach((k) => fields.add(k));
    }

    // Compare each field
    const differences = Array.from(fields).map((field) => {
      const value1 = log1.new_values?.[field];
      const value2 = log2.new_values?.[field];
      const changed = JSON.stringify(value1) !== JSON.stringify(value2);

      return {
        field,
        value1,
        value2,
        changed,
      };
    });

    return { log1, log2, differences };
  }

  /**
   * Export logs
   */
  async export(options: ExportOptions): Promise<string | Buffer> {
    const filter = options.filter ? this.applyAdvancedFilters(options.filter) : {};

    const logs = await this.auditLogService.find(filter);

    switch (options.format) {
      case 'json':
        return this.exportToJson(logs, options.include_metadata);

      case 'csv':
        return this.exportToCsv(logs);

      case 'excel':
        // Would require xlsx library
        throw new Error('Excel export not yet implemented');

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Apply advanced filters
   */
  private applyAdvancedFilters(filter: AdvancedAuditFilter): AuditLogFilter {
    const result: AuditLogFilter = { ...filter };

    // Date shortcuts
    const now = new Date();

    if (filter.today) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result.start_date = today;
    }

    if (filter.yesterday) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      result.start_date = yesterday;
      result.end_date = yesterdayEnd;
    }

    if (filter.this_week) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      result.start_date = weekStart;
    }

    if (filter.this_month) {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      result.start_date = monthStart;
    }

    if (filter.last_7_days) {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      result.start_date = sevenDaysAgo;
    }

    if (filter.last_30_days) {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result.start_date = thirtyDaysAgo;
    }

    return result;
  }

  /**
   * Export to JSON
   */
  private exportToJson(logs: AuditLogEntry[], includeMetadata = false): string {
    const data = logs.map((log) => {
      if (includeMetadata) {
        return log;
      }

      // Exclude internal metadata
      const { id, created_at, ...rest } = log;
      return {
        ...rest,
        timestamp: created_at,
      };
    });

    return JSON.stringify(data, null, 2);
  }

  /**
   * Export to CSV
   */
  private exportToCsv(logs: AuditLogEntry[]): string {
    if (logs.length === 0) {
      return '';
    }

    // CSV headers
    const headers = [
      'timestamp',
      'action',
      'entity_type',
      'entity_id',
      'user_id',
      'user_name',
      'status',
      'changes_count',
      'endpoint',
      'method',
    ];

    // CSV rows
    const rows = logs.map((log) => [
      log.created_at.toISOString(),
      log.action,
      log.entity_type,
      log.entity_id || '',
      log.user_id,
      log.user_name || '',
      log.status,
      log.changes?.length || 0,
      log.endpoint || '',
      log.method || '',
    ]);

    // Build CSV
    const csvLines = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ];

    return csvLines.join('\n');
  }
}
