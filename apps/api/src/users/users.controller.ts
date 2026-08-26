import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all staff users (Super Admin only)' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create new staff user (Super Admin only)' })
  async create(@Body() body: { username: string; password: string; fullName: string; role: Role }) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update staff user account details or status (Super Admin only)' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      isActive?: boolean;
      username?: string;
      password?: string;
      fullName?: string;
      role?: Role;
    },
  ) {
    if (body.isActive !== undefined) {
      return this.usersService.toggleActive(id, body.isActive);
    }
    return this.usersService.update(id, body);
  }
}
