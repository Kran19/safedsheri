import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: users };
  }

  async create(data: { username: string; password: string; fullName: string; role: Role }) {
    const existing = await this.prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existing) {
      throw new BadRequestException('Username already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        passwordHash: this.hashPassword(data.password),
        fullName: data.fullName,
        role: data.role,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return { success: true, data: user, message: 'User created successfully' };
  }

  async toggleActive(id: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    return { success: true, data: updated, message: `User status updated to ${isActive ? 'active' : 'disabled'}` };
  }

  async update(id: string, data: { username?: string; password?: string; fullName?: string; role?: Role }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.username && data.username !== user.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: data.username },
      });
      if (existing) {
        throw new BadRequestException('Username already exists');
      }
    }

    const updateData: any = {
      username: data.username ?? user.username,
      fullName: data.fullName ?? user.fullName,
      role: data.role ?? user.role,
    };

    if (data.password && data.password.trim().length > 0) {
      updateData.passwordHash = this.hashPassword(data.password);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    return { success: true, data: updated, message: 'User details updated successfully' };
  }

  async findAllBypassed() {
    const list = await this.prisma.otpBypass.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: list };
  }

  async addBypassed(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      throw new BadRequestException('Invalid phone number. Must be a 10-digit number.');
    }

    const existing = await this.prisma.otpBypass.findUnique({
      where: { phone: cleanPhone },
    });

    if (existing) {
      return { success: true, data: existing, message: 'Phone number already bypassed.' };
    }

    const created = await this.prisma.otpBypass.create({
      data: { phone: cleanPhone },
    });

    return { success: true, data: created, message: `OTP verification bypassed for number: ${cleanPhone}` };
  }

  async removeBypassed(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      throw new BadRequestException('Invalid phone number. Must be a 10-digit number.');
    }

    const existing = await this.prisma.otpBypass.findUnique({
      where: { phone: cleanPhone },
    });

    if (!existing) {
      throw new NotFoundException('Phone number not found in bypass list.');
    }

    await this.prisma.otpBypass.delete({
      where: { phone: cleanPhone },
    });

    return { success: true, message: `Bypass removed for number: ${cleanPhone}` };
  }
}
