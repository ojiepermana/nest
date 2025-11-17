import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { EntityController } from './controllers/entity.controller';
import { EntityService } from './services/entity.service';
import { EntityRepository } from './repositories/entity.repository';
import { AuditModule } from '@ojiepermana/nest-generator/audit';
import { LocationController } from './controllers/location.controller';
import { LocationService } from './services/location.service';
import { LocationRepository } from './repositories/location.repository';

@Module({
  imports: [CacheModule.register(), AuditModule],
  controllers: [EntityController, LocationController],
  providers: [EntityService, EntityRepository, LocationService, LocationRepository],
  exports: [EntityService, EntityRepository, LocationService, LocationRepository]
})
export class EntityModule {}
