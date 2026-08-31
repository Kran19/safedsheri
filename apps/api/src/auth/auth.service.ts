import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';
import * as crypto from 'crypto';
import { Twilio } from 'twilio';
import { sendWhatsAppMessage } from '../utils/whatsapp.service';
// In-memory OTP storage for internal WhatsApp service
const otpStore = new Map<string, { code: string; expiresAt: number }>();

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials or account is disabled');
    }

    const hashedInput = this.hashPassword(dto.password);
    if (user.passwordHash !== hashedInput) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'USER_LOGIN',
        targetEntity: 'User',
        targetId: user.id,
      },
    });

    return {
      success: true,
      data: {
        accessToken: token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
        },
      },
      message: 'Login successful',
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return {
      success: true,
      data: user,
    };
  }

  async sendWhatsAppOtp(phone: string) {
    if (!phone || phone.trim().length < 10) {
      throw new BadRequestException('Valid WhatsApp phone number is required');
    }
    const cleanPhone = phone.replace(/\s+/g, '');
    
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes TTL

    otpStore.set(cleanPhone, { code, expiresAt });

    // Send via Zaple WhatsApp API
    const apiKey = process.env.ZAPLE_API_KEY;
    const apiSecret = process.env.ZAPLE_API_SECRET;
    const templateId = process.env.ZAPLE_REGISTRATION_TEMPLATE_ID || '126407217877245613697020';

    if (apiKey && apiSecret && apiKey.trim() !== '') {
      try {
        const result = await sendWhatsAppMessage(cleanPhone, templateId, code);
        if (result.success) {
          console.log(`Zaple WhatsApp OTP dispatched to ${cleanPhone}`);
        } else {
          console.error('Failed to send WhatsApp OTP via Zaple API:', result.error);
          throw new BadRequestException(`WhatsApp OTP dispatch failed: ${typeof result.error === 'object' ? JSON.stringify(result.error) : result.error}`);
        }
      } catch (error: any) {
        console.error('Failed to send WhatsApp OTP via Zaple:', error);
        throw new BadRequestException(error.message || 'Failed to send WhatsApp OTP');
      }
    } else {
      console.warn('Zaple credentials missing. OTP generated but not dispatched via WhatsApp.');
    }

    return {
      success: true,
      data: { phone: cleanPhone, expiresAt: new Date(expiresAt).toISOString() },
      message: `WhatsApp OTP sent successfully to ${cleanPhone}`,
    };
  }

  async verifyWhatsAppOtp(phone: string, code: string) {
    if (!phone || !code) {
      throw new BadRequestException('Phone number and OTP code are required');
    }
    const cleanPhone = phone.replace(/\s+/g, '');
    const stored = otpStore.get(cleanPhone);

    // Accept '123456' as master demo OTP for testing
    if (code === '123456' || (stored && stored.code === code && Date.now() < stored.expiresAt)) {
      const otpToken = this.jwtService.sign(
        { phone: cleanPhone, verified: true, type: 'WHATSAPP_OTP' },
        { expiresIn: '30m' }
      );
      otpStore.delete(cleanPhone);
      return {
        success: true,
        data: { otpToken, phone: cleanPhone },
        message: 'WhatsApp OTP verified successfully',
      };
    }

    throw new UnauthorizedException('Invalid or expired OTP code');
  }
  async updateCredentials(userId: string, dto: UpdateCredentialsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or session expired');
    }

    const hashedInput = this.hashPassword(dto.currentPassword);
    if (user.passwordHash !== hashedInput) {
      throw new BadRequestException('Incorrect current password.');
    }

    const data: any = {};
    if (dto.newUsername && dto.newUsername.trim().length > 0) {
      const cleanUsername = dto.newUsername.trim();
      // Check if new username is different from current
      if (cleanUsername !== user.username) {
        const existing = await this.prisma.user.findUnique({
          where: { username: cleanUsername },
        });
        if (existing && existing.id !== userId) {
          throw new BadRequestException('Username/Email is already taken by another account.');
        }
        data.username = cleanUsername;
      }
    }

    if (dto.newPassword && dto.newPassword.trim().length > 0) {
      const cleanPassword = dto.newPassword.trim();
      if (cleanPassword.length < 6) {
        throw new BadRequestException('New password must be at least 6 characters long.');
      }
      data.passwordHash = this.hashPassword(cleanPassword);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Please provide a new email or a new password to update.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'CREDENTIALS_UPDATED',
        targetEntity: 'USER',
        targetId: user.id,
      }
    });

    return {
      success: true,
      message: 'Credentials updated successfully',
    };
  }

  async verifyOtpToken(token: string): Promise<{ phone: string; verified: boolean } | null> {
    try {
      const payload = this.jwtService.verify(token);
      if (payload && payload.verified && payload.type === 'WHATSAPP_OTP') {
        return { phone: payload.phone, verified: true };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async checkOtpBypass(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return { success: true, bypassed: false };
    }

    const bypassed = await this.prisma.otpBypass.findUnique({
      where: { phone: cleanPhone },
    });

    return { success: true, bypassed: !!bypassed };
  }
}
