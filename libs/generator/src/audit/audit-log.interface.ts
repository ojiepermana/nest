/**
 * Audit Log Interface
 *
 * Comprehensive activity logging for all CRUD operations
 * Supports rollback functionality and compliance tracking
 */

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'RESTORE'
  | 'READ'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'CUSTOM';

export type AuditStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;

  // Action details
  action: AuditAction;
  entity_type: string; // e.g., 'users', 'products'
  entity_id?: string; // ID of affected entity

  // User tracking
  user_id: string;
  user_name?: string;
  user_ip?: string;
  user_agent?: string;

  // Change tracking
  old_values?: Record<string, any>; // Previous state
  new_values?: Record<string, any>; // New state
  changes?: ChangeDetail[]; // Detailed changes

  // Request context
  endpoint?: string; // API endpoint
  method?: string; // HTTP method
  status: AuditStatus;
  error_message?: string;

  // Metadata
  metadata?: Record<string, any>; // Custom metadata
  tags?: string[]; // Tags for filtering

  // Timestamps
  created_at: Date;

  // Rollback support
  is_rolled_back?: boolean;
  rolled_back_at?: Date;
  rolled_back_by?: string;
}

/**
 * Detailed change information
 */
export interface ChangeDetail {
  field: string;
  old_value: any;
  new_value: any;
  data_type: string;
}

/**
 * Create audit log DTO
 */
export interface CreateAuditLogDto {
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  user_id: string;
  user_name?: string;
  user_ip?: string;
  user_agent?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  endpoint?: string;
  method?: string;
  status?: AuditStatus;
  error_message?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * Audit log filter
 */
export interface AuditLogFilter {
  action?: AuditAction | AuditAction[];
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  status?: AuditStatus;
  tags?: string[];
  start_date?: Date;
  end_date?: Date;
  search?: string; // Search in entity_type, user_name, etc.
}

/**
 * Rollback options
 */
export interface RollbackOptions {
  audit_log_id: string;
  rolled_back_by: string;
  reason?: string;
  validate?: boolean; // Validate before rollback
}

/**
 * Audit log statistics
 */
export interface AuditLogStats {
  total_logs: number;
  by_action: Record<AuditAction, number>;
  by_entity: Record<string, number>;
  by_user: Record<string, number>;
  by_status: Record<AuditStatus, number>;
  failed_count: number;
  rolled_back_count: number;
}

/**
 * Audit log service interface
 */
export interface IAuditLogService {
  /**
   * Create audit log entry
   */
  log(dto: CreateAuditLogDto): Promise<AuditLogEntry>;

  /**
   * Get audit log by ID
   */
  findOne(id: string): Promise<AuditLogEntry | null>;

  /**
   * Query audit logs with filters
   */
  query(
    filter: AuditLogFilter,
    page?: number,
    limit?: number,
  ): Promise<{ data: AuditLogEntry[]; total: number }>;

  /**
   * Get audit logs for specific entity
   */
  getEntityHistory(entity_type: string, entity_id: string): Promise<AuditLogEntry[]>;

  /**
   * Get user activity
   */
  getUserActivity(user_id: string, start_date?: Date, end_date?: Date): Promise<AuditLogEntry[]>;

  /**
   * Rollback to previous state
   */
  rollback(options: RollbackOptions): Promise<AuditLogEntry>;

  /**
   * Get rollback history for entity
   */
  getRollbackHistory(entity_type: string, entity_id: string): Promise<AuditLogEntry[]>;

  /**
   * Get audit statistics
   */
  getStats(filter?: AuditLogFilter): Promise<AuditLogStats>;

  /**
   * Archive old logs (for compliance)
   */
  archive(before_date: Date): Promise<number>;

  /**
   * Export audit logs
   */
  export(filter: AuditLogFilter, format: 'json' | 'csv'): Promise<string | Buffer>;
}

/**
 * Audit log configuration
 */
export interface AuditLogConfig {
  enabled: boolean;
  log_reads?: boolean; // Log SELECT operations
  log_successful_only?: boolean; // Only log successful operations
  excluded_entities?: string[]; // Entities to exclude from logging
  excluded_fields?: string[]; // Fields to exclude (e.g., passwords)
  retention_days?: number; // Auto-archive after X days
  anonymize_pii?: boolean; // Anonymize personally identifiable info
}
