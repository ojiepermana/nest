import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { BusinessEntityController } from './controllers/business-entity.controller';
import { BusinessEntityService } from './services/business-entity.service';
import { BusinessEntityRepository } from './repositories/business-entity.repository';

@Module({
  imports: [CacheModule.register()],
  controllers: [BusinessEntityController],
  providers: [BusinessEntityService, BusinessEntityRepository],
  exports: [BusinessEntityService, BusinessEntityRepository]
})
export class BusinessEntityModule {}
