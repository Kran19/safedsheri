import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('SafedSheriBootstrap');
  const app = await NestFactory.create(AppModule);

  // Set Global Prefix to /api/v1
  app.setGlobalPrefix('api/v1');

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable DTO validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Configure Swagger Documentation at /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Safed Sheri Operational API')
    .setDescription('Specialized Registration, Offline Payment & Gate Entry System for Safed Sheri 2026')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Safed Sheri API running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
