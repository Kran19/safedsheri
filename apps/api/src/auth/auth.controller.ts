import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate staff user (Super Admin, Ticketing Finance, Entry Verification)' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('whatsapp-otp/send')
  @ApiOperation({ summary: 'Send OTP to attendee WhatsApp phone number (Internal Service)' })
  async sendWhatsAppOtp(@Body() body: { phone: string }) {
    return this.authService.sendWhatsAppOtp(body.phone);
  }

  @Post('whatsapp-otp/verify')
  @ApiOperation({ summary: 'Verify OTP code and return verified session token' })
  async verifyWhatsAppOtp(@Body() body: { phone: string; code: string }) {
    return this.authService.verifyWhatsAppOtp(body.phone, body.code);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Logout staff session' })
  async logout(@Request() req) {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get profile of current authenticated staff user' })
  async me(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}
