import { Module } from '@nestjs/common';
import { EntityController } from './controllers/entity.controller';
import { EntityService } from './services/entity.service';
import { EntityRepository } from './repositories/entity.repository';

@Module({
  controllers: [EntityController],
  providers: [EntityService, EntityRepository],
  exports: [EntityService, EntityRepository],
})
export class EntityModule {}
