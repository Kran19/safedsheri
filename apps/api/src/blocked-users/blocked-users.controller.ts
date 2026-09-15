import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BlockedUsersService } from './blocked-users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Blocked Users')
@Controller('blocked-users')
export class BlockedUsersController {
  constructor(private readonly blockedUsersService: BlockedUsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all blocked users and phone numbers' })
  async findAll() {
    return this.blockedUsersService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a user or phone number to the block list' })
  async blockUser(
    @Request() req: any,
    @Body()
    body: {
      phone: string;
      fullName?: string;
      aadhaarNumber?: string;
      reason?: string;
    },
  ) {
    return this.blockedUsersService.blockUser({
      ...body,
      actorId: req.user.id,
    });
  }

  @Post('block-registration/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block attendee(s) from a registration application' })
  async blockRegistration(
    @Param('id') id: string,
    @Request() req: any,
    @Body()
    body: {
      attendeeIds?: string[];
      reason?: string;
    },
  ) {
    return this.blockedUsersService.blockRegistration(
      id,
      body.attendeeIds,
      body.reason,
      req.user.id,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a user from the block list (Unblock)' })
  async unblockUser(@Param('id') id: string, @Request() req: any) {
    return this.blockedUsersService.unblockUser(id, req.user.id);
  }

  @Get('check/:phone')
  @ApiOperation({ summary: 'Check if a phone number is blocked from booking' })
  async checkBlocked(@Param('phone') phone: string) {
    const record = await this.blockedUsersService.isBlocked(phone);
    return {
      success: true,
      blocked: !!record,
      reason: record?.reason || null,
    };
  }
}
