import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CacheModule } from '@nestjs/cache-manager';
import { LocationTypeController } from './controllers/location-type.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'LOCATION_TYPE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.LOCATION_TYPE_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.LOCATION_TYPE_SERVICE_PORT || '3001'),
        },
      },
    ]), CacheModule.register()],
  controllers: [LocationTypeController]
})
export class LocationTypeModule {}
