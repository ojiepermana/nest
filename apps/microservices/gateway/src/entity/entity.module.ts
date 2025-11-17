import { Module } from '@nestjs/common';
import { EntityController } from './controllers/entity.controller';
import { LocationController } from './controllers/location.controller';
import { BusinessEntityController } from './controllers/business-entity.controller';

@Module({
  controllers: [EntityController, LocationController, BusinessEntityController],
})
export class EntityModule {}
