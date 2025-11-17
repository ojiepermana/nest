import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { EntityController } from './controllers/entity.controller';
import { EntityService } from './services/entity.service';
import { EntityRepository } from './repositories/entity.repository';
import { AuditModule } from '@ojiepermana/nest-generator/audit';

@Module({
  imports: [CacheModule.register(), AuditModule],
  controllers: [EntityController],
  providers: [EntityService, EntityRepository],
  exports: [EntityService, EntityRepository]
})
export class EntityModule {}
