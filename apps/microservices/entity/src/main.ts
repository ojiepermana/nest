import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { EntityServiceModule } from './entity-service.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

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

  
  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Auto-generated CRUD API documentation')
    .setVersion('1.0')
    .addTag('location', 'Location CRUD operations')
    .addTag('entity', 'Entity CRUD operations')
    .addTag('business-entity', 'BusinessEntity CRUD operations')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen();
  console.log('🚀 Entity Microservice is running on port 3004');
}
bootstrap();
