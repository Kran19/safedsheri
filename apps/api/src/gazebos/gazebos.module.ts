import { Module } from '@nestjs/common';
import { GazebosService } from './gazebos.service';
import { GazebosController } from './gazebos.controller';
import { CredentialsModule } from '../credentials/credentials.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CredentialsModule, AuthModule],
  controllers: [GazebosController],
  providers: [GazebosService],
  exports: [GazebosService],
})
export class GazebosModule {}
