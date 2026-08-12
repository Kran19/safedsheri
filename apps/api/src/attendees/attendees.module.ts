import { Module } from '@nestjs/common';
import { AttendeesService } from './attendees.service';
import { AttendeesController } from './attendees.controller';
import { EncryptionService } from '../common/encryption.service';

@Module({
  controllers: [AttendeesController],
  providers: [AttendeesService, EncryptionService],
  exports: [AttendeesService],
})
export class AttendeesModule {}
