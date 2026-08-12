import { Module } from '@nestjs/common';
import { PaymentLocationsService } from './payment-locations.service';
import { PaymentLocationsController } from './payment-locations.controller';

@Module({
  controllers: [PaymentLocationsController],
  providers: [PaymentLocationsService],
  exports: [PaymentLocationsService],
})
export class PaymentLocationsModule {}
