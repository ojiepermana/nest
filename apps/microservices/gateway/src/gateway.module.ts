import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { EntityModule } from './entity/entity.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    EntityModule,
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USER_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.USER_SERVICE_PORT || '3001'),
        },
      },
      {
        name: 'ENTITY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ENTITY_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.ENTITY_SERVICE_PORT || '3004'),
        },
      },
    ]),
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
  exports: [ClientsModule], // Export to make available to child modules
})
export class GatewayModule {}
