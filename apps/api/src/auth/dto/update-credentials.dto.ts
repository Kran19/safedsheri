import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCredentialsDto {
  @ApiProperty({ description: 'New email/username', required: false })
  @IsOptional()
  @IsString()
  newUsername?: string;

  @ApiProperty({ description: 'New password', required: false })
  @IsOptional()
  @IsString()
  newPassword?: string;

  @ApiProperty({ description: 'Current password for verification' })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;
}
