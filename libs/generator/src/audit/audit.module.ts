/**
 * Audit Module
 *
 * Provides audit logging services to other modules
 */

import { Module, Global } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditQueryService } from './audit-query.service';

@Global()
@Module({
  providers: [AuditLogService, AuditQueryService],
  exports: [AuditLogService, AuditQueryService],
})
export class AuditModule {}
