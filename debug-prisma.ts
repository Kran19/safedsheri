import { NestFactory } from '@nestjs/core';
import { AppModule } from './apps/api/src/app.module';
import { RegistrationsService } from './apps/api/src/registrations/registrations.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const registrationsService = app.get(RegistrationsService);
  
  // Try to access prisma inside the service
  console.log('Is prisma defined?', !!(registrationsService as any).prisma);
  console.log('Keys of prisma:', Object.keys((registrationsService as any).prisma || {}));

  await app.close();
}

bootstrap();
