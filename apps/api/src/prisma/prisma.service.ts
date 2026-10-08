import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');

      // Ensure PostgreSQL enum includes FAMILY_AND_FRIENDS
      try {
        await this.$executeRawUnsafe(`ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'FAMILY_AND_FRIENDS'`);
        this.logger.log('✓ Ensured PaymentMethod enum includes FAMILY_AND_FRIENDS');
      } catch (e: any) {
        this.logger.warn(`PaymentMethod enum alter check: ${e.message}`);
      }
      
      // Auto-update Couple Pass prices (e.g. SS-2026-000810) to Phase 2 price ₹8,500
      this.registration.updateMany({
        where: {
          OR: [
            { registrationNumber: 'SS-2026-000810' },
            { passType: 'COUPLE', amountDue: { lt: 8500 } }
          ]
        },
        data: { amountDue: 8500 }
      }).then((res) => {
        if (res.count > 0) {
          this.logger.log(`✓ Updated ${res.count} Couple Pass registrations to ₹8,500`);
        }
      }).catch((e) => this.logger.warn(`Couple pass price patch skipped: ${e.message}`));

      this.payment.updateMany({
        where: {
          registration: {
            OR: [
              { registrationNumber: 'SS-2026-000810' },
              { passType: 'COUPLE' }
            ]
          },
          status: 'PENDING'
        },
        data: { amount: 8500 }
      }).catch(() => {});
    } catch (error) {
      this.logger.error(`⚠️  Database connection failed: ${error.message}`);
      this.logger.warn('API will start but DB-dependent routes will fail until database is available.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
