import { Module } from '@nestjs/common';
import { GazebosService } from './gazebos.service';
import { GazebosController } from './gazebos.controller';

@Module({
  controllers: [GazebosController],
  providers: [GazebosService],
  exports: [GazebosService],
})
export class GazebosModule {}
