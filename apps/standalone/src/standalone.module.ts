import { Module } from '@nestjs/common';
import { StandaloneController } from './standalone.controller';
import { StandaloneService } from './standalone.service';
import { EntityModule } from './entity/entity.module';

@Module({
  imports: [EntityModule],
  controllers: [StandaloneController],
  providers: [StandaloneService],
})
export class StandaloneModule {}
