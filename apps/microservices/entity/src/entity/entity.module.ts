import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AuditModule } from '@ojiepermana/nest-generator/audit';
import { EntityController } from './controllers/entity.controller';
import { EntityService } from './services/entity.service';
import { EntityRepository } from './repositories/entity.repository';
import { LocationController } from './controllers/location.controller';
import { LocationService } from './services/location.service';
import { LocationRepository } from './repositories/location.repository';
import { BusinessEntityController } from './controllers/business-entity.controller';
import { BusinessEntityService } from './services/business-entity.service';
import { BusinessEntityRepository } from './repositories/business-entity.repository';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60000, // 60 seconds
      max: 100, // maximum number of items in cache
    }),
    AuditModule,
  ],
  controllers: [EntityController, LocationController, BusinessEntityController],
  providers: [
    EntityService,
    EntityRepository,
    LocationService,
    LocationRepository,
    BusinessEntityService,
    BusinessEntityRepository,
  ],
  exports: [
    EntityService,
    EntityRepository,
    LocationService,
    LocationRepository,
    BusinessEntityService,
    BusinessEntityRepository,
  ],
})
export class EntityModule {}
