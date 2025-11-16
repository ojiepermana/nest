import { Module } from '@nestjs/common';
import { EntityController } from './entity.controller';
import { EntityService } from './entity.service';

@Module({
  imports: [],
  controllers: [EntityController],
  providers: [EntityService],
})
export class EntityModule {}
