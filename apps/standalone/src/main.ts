import { NestFactory } from '@nestjs/core';
import { StandaloneModule } from './standalone.module';

async function bootstrap() {
  const app = await NestFactory.create(StandaloneModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
