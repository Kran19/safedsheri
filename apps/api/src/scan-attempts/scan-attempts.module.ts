import { Module } from '@nestjs/common';
import { ScanAttemptsService } from './scan-attempts.service';
import { ScanAttemptsController } from './scan-attempts.controller';

@Module({
  controllers: [ScanAttemptsController],
  providers: [ScanAttemptsService],
  exports: [ScanAttemptsService],
})
export class ScanAttemptsModule {}
