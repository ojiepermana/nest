import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EntityController } from './controllers/entity.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ENTITY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ENTITY_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.ENTITY_SERVICE_PORT || '3001'),
        },
      },
    ]),
  ],
  controllers: [EntityController],
})
export class EntityModule {}
