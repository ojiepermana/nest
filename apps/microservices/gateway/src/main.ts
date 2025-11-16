import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Auto-generated CRUD API documentation')
    .setVersion('1.0')
    .addTag('entity', 'Entity CRUD operations')
    .addTag('location-type', 'LocationType CRUD operations')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.port ?? 3000);
}
bootstrap();
