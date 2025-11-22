import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CacheModule } from '@nestjs/cache-manager';
import { EntityController } from './controllers/entity.controller';
import { AuditModule } from '@ojiepermana/nest-generator/audit';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'GATEWAY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.GATEWAY_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.GATEWAY_SERVICE_PORT || '3001'),
        },
      },
    ]), CacheModule.register(), AuditModule],
  controllers: [EntityController]
})
export class EntityModule {}
