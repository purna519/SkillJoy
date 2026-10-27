import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@skilljoy/database';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ══════════════════════════════════════════
  // SIGNUP
  // ══════════════════════════════════════════
  async signup(dto: SignupDto, ipAddress?: string, userAgent?: string) {
    const role = dto.role ?? Role.USER;

    // 1) Username globally unique across ALL roles
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException(
        'Username already taken. Please choose another.',
      );
    }

    // 2) Email unique per role (same email CAN be used for USER + CREATOR)
    const existingEmail = await this.prisma.user.findFirst({
      where: { email: dto.email, role },
    });
    if (existingEmail) {
      throw new ConflictException(
        `An account with this email already exists as a ${role.toLowerCase()}.`,
      );
    }

    // 3) Phone unique per role (if provided)
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: dto.phone, role },
      });
      if (existingPhone) {
        throw new ConflictException(
          `An account with this phone number already exists as a ${role.toLowerCase()}.`,
        );
      }
    }

    // 4) Hash password
    const passwordHash = await argon2.hash(dto.password);

    // 5) Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // 6) Parse date of birth
    const dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined;

    // 7) Create user — ALWAYS create userProfile for every role so avatar/bio work everywhere
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        fullName: dto.fullName,
        phone: dto.phone ?? null,
        dateOfBirth: dateOfBirth ?? null,
        gender: dto.gender ?? null,
        passwordHash,
        role,
        emailVerificationToken,
        settings: { create: {} },
        // Create userProfile for ALL roles (needed for avatar, bio, display name)
        userProfile: {
          create: {
            displayName: dto.fullName ?? dto.username,
          },
        },
        // Additionally create creatorProfile only for CREATOR role
        creatorProfile:
          role === Role.CREATOR
            ? { create: { creatorSlug: dto.username } }
            : undefined,
      },
    });

    // 8) Log token in dev (replace with real email sending later)
    const verifyUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/verify-email?token=${emailVerificationToken}`;
    console.log(`\n📧 Verify email for ${user.email}:\n   ${verifyUrl}\n`);

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.username,
      ipAddress,
      userAgent,
    );

    return {
      ...tokens,
      emailVerificationRequired: true,
    };
  }

  // ══════════════════════════════════════════
  // LOGIN
  // ══════════════════════════════════════════
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    // Find by email — pick most recently created account if multiple roles
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      orderBy: { createdAt: 'desc' },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.username,
      ipAddress,
      userAgent,
    );
  }

  // ══════════════════════════════════════════
  // EMAIL VERIFICATION
  // ══════════════════════════════════════════
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
      },
    });

    return { message: 'Email verified successfully! You can now log in.' };
  }

  // ══════════════════════════════════════════
  // REFRESH TOKEN
  // ══════════════════════════════════════════
  async refreshToken(userId: string, refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_SECRET ?? 'dev_secret_change_in_production',
      });
      if (payload.sub !== userId) throw new Error('Token mismatch');
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    return this.generateTokens(user.id, user.email, user.role, user.username);
  }

  // ══════════════════════════════════════════
  // GET CURRENT USER
  // ══════════════════════════════════════════
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        userProfile: {
          select: {
            displayName: true,
            avatarUrl: true,
            bio: true,
            bannerUrl: true,
          },
        },
        creatorProfile: {
          select: {
            creatorSlug: true,
            creatorTitle: true,
            totalViews: true,
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  // ══════════════════════════════════════════
  // PRIVATE: Generate JWT tokens
  // ══════════════════════════════════════════
  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    username: string,
    _ipAddress?: string,
    _userAgent?: string,
  ) {
    const secret = process.env.JWT_SECRET ?? 'dev_secret_change_in_production';
    const payload = { sub: userId, email, role, username };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m', secret }),
      this.jwtService.signAsync(payload, { expiresIn: '7d', secret }),
    ]);

    return { id: userId, accessToken, refreshToken, username, role };
  }
}
