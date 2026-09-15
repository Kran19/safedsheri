import { Module } from '@nestjs/common';
import { BlockedUsersService } from './blocked-users.service';
import { BlockedUsersController } from './blocked-users.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [BlockedUsersController],
  providers: [BlockedUsersService],
  exports: [BlockedUsersService],
})
export class BlockedUsersModule {}
