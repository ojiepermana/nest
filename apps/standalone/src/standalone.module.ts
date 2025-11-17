import { Module } from '@nestjs/common';
import { StandaloneController } from './standalone.controller';
import { StandaloneService } from './standalone.service';

@Module({
  imports: [],
  controllers: [StandaloneController],
  providers: [StandaloneService],
})
export class StandaloneModule {}
