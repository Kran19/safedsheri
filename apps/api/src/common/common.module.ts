import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { EmailService } from './email.service';

@Global()
@Module({
  providers: [EncryptionService, EmailService],
  exports: [EncryptionService, EmailService],
})
export class CommonModule {}
