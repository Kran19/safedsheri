import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AttendeesModule } from './attendees/attendees.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { PaymentLocationsModule } from './payment-locations/payment-locations.module';
import { PaymentsModule } from './payments/payments.module';
import { CredentialsModule } from './credentials/credentials.module';
import { EntriesModule } from './entries/entries.module';
import { ScanAttemptsModule } from './scan-attempts/scan-attempts.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { MediaModule } from './media/media.module';
import { GazebosModule } from './gazebos/gazebos.module';
import { InquiriesModule } from './inquiries/inquiries.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AttendeesModule,
    RegistrationsModule,
    PaymentLocationsModule,
    PaymentsModule,
    CredentialsModule,
    EntriesModule,
    ScanAttemptsModule,
    ReportsModule,
    AuditModule,
    MediaModule,
    GazebosModule,
    InquiriesModule,
  ],
})
export class AppModule {}
