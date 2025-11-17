import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CacheModule } from '@nestjs/cache-manager';
import { EntityController } from './controllers/entity.controller';
import { AuditModule } from '@ojiepermana/nest-generator/audit';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ENTITY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ENTITY_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.ENTITY_SERVICE_PORT || '3004'),
        },
      }]), CacheModule.register(), AuditModule],
  controllers: [EntityController]
})
export class EntityModule {}
