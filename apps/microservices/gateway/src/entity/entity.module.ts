import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CacheModule } from '@nestjs/cache-manager';
import { AuditModule } from '@ojiepermana/nest-generator/audit';
import { LocationController } from './controllers/location.controller';
import { BusinessEntityController } from './controllers/business-entity.controller';
import { EntityController } from './controllers/entity.controller';
import { DocumentController } from './controllers/document.controller';

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
  controllers: [LocationController, BusinessEntityController, DocumentController]
})
export class EntityModule {}
