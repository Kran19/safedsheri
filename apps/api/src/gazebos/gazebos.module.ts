import { Module } from '@nestjs/common';
import { GazebosService } from './gazebos.service';
import { GazebosController } from './gazebos.controller';
import { CredentialsModule } from '../credentials/credentials.module';

@Module({
  imports: [CredentialsModule],
  controllers: [GazebosController],
  providers: [GazebosService],
  exports: [GazebosService],
})
export class GazebosModule {}
