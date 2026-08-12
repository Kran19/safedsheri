import { Module } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { EncryptionService } from '../common/encryption.service';

@Module({
  controllers: [RegistrationsController],
  providers: [RegistrationsService, EncryptionService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
