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
      

    } catch (error) {
      this.logger.error(`⚠️  Database connection failed: ${error.message}`);
      this.logger.warn('API will start but DB-dependent routes will fail until database is available.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
