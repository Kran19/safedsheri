import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCredentialsDto {
  @ApiProperty({ description: 'New email/username' })
  @IsNotEmpty()
  @IsString()
  newUsername: string;

  @ApiProperty({ description: 'New password', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;

  @ApiProperty({ description: 'Current password for verification' })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;
}
