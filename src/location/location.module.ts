import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { LocationController } from './controllers/location.controller';
import { LocationService } from './services/location.service';
import { LocationRepository } from './repositories/location.repository';

@Module({
  imports: [CacheModule.register()],
  controllers: [LocationController],
  providers: [LocationService, LocationRepository],
  exports: [LocationService, LocationRepository]
})
export class LocationModule {}
