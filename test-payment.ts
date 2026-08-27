import { NestFactory } from '@nestjs/core';
import { AppModule } from './apps/api/src/app.module';
import { RegistrationsService } from './apps/api/src/registrations/registrations.service';
import { PaymentMethod } from '@prisma/client';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const registrationsService = app.get(RegistrationsService);

  // We need a test registration ID
  // Let's get one from the db first
  const { PrismaService } = await import('./apps/api/src/prisma/prisma.service');
  const prisma = app.get(PrismaService);
  
  let reg = await prisma.registration.findFirst({
    where: { status: 'SUBMITTED' }
  });

  if (!reg) {
    reg = await prisma.registration.findFirst();
  }

  console.log('Testing with Registration ID:', reg?.id);
  
  if (reg) {
    try {
      const result = await registrationsService.updatePaymentMethod(reg.id, PaymentMethod.CASH, 'test-admin-id', true);
      console.log('Result:', result);
    } catch (e) {
      console.error('Error testing endpoint:', e);
    }
  }

  await app.close();
}

bootstrap();
