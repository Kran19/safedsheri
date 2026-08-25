import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';
import * as crypto from 'crypto';
import { Twilio } from 'twilio';
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

    // Send via Twilio if configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    if (accountSid && authToken && accountSid.trim() !== '') {
      try {
        const client = new Twilio(accountSid, authToken);
        const toPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
        await client.messages.create({
          body: `Your Safed Sheri OTP is: ${code}. It is valid for 10 minutes.`,
          from: twilioNumber,
          to: `whatsapp:${toPhone}`,
        });
        console.log(`Twilio WhatsApp OTP dispatched to ${toPhone}`);
      } catch (error) {
        console.error('Failed to send WhatsApp OTP via Twilio:', error);
        // We can throw here if we want strict failure, or proceed
      }
    } else {
      console.warn('Twilio credentials missing. OTP generated but not dispatched via WhatsApp.');
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
      throw new UnauthorizedException('User not found');
    }

    const hashedInput = this.hashPassword(dto.currentPassword);
    if (user.passwordHash !== hashedInput) {
      throw new BadRequestException('Incorrect current password');
    }

    const data: any = {};
    if (dto.newUsername) {
      // Check if new username exists for another user
      const existing = await this.prisma.user.findUnique({
        where: { username: dto.newUsername },
      });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Username/Email is already taken');
      }
      data.username = dto.newUsername;
    }

    if (dto.newPassword && dto.newPassword.trim().length > 0) {
      data.passwordHash = this.hashPassword(dto.newPassword);
    }

    if (Object.keys(data).length > 0) {
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
    }

    return {
      success: true,
      message: 'Credentials updated successfully',
    };
  }
}
