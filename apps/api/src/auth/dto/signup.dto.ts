import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Role } from '@skilljoy/database';

export class SignupDto {
  // ── Step 1: Identity ──
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  // ── Step 2: Personal Details ──
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  // ── Step 3: Password ──
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  // ── Role ──
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
