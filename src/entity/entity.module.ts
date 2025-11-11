import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { EntityController } from './controllers/entity.controller';
import { EntityService } from './services/entity.service';
import { EntityRepository } from './repositories/entity.repository';

@Module({
  imports: [CacheModule.register()],
  controllers: [EntityController],
  providers: [EntityService, EntityRepository],
  exports: [EntityService, EntityRepository],
})
export class EntityModule {}
