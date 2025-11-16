import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { EntityModule } from './entity/entity.module';

@Module({
  imports: [EntityModule],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
