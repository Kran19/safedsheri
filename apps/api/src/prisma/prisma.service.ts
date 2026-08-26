import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error(`⚠️  Database connection failed: ${error.message}`);
      this.logger.warn('API will start but DB-dependent routes will fail until database is available.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
