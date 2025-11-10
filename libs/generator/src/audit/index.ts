/**
 * Audit Trail Module
 *
 * Complete audit logging system with:
 * - Automatic CRUD operation logging
 * - Change tracking with rollback capability
 * - User activity monitoring
 * - Compliance features (archive, export)
 */

// Module
export * from './audit.module';

// Interfaces
export * from './audit-log.interface';

// Services
export * from './audit-log.service';
export * from './audit-query.service';

// Decorator
export * from './audit-log.decorator';
