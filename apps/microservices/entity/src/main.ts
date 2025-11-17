import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { EntityServiceModule } from './entity-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(EntityServiceModule, {
    transport: Transport.TCP,
    options: {
      host: process.env.ENTITY_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.ENTITY_SERVICE_PORT || '3004'),
    },
  });

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen();
  console.log('🚀 Entity Microservice is running on port 3004');
}
bootstrap();
