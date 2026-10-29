import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SalonStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { PartnerRegisterDto } from './dto/partner-register.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
  ) { }

  async requestOtp(dto: RequestOtpDto): Promise<{ message: string; phoneNumber: string; otp?: string }> {
    const { phoneNumber } = dto;

    // Generate a 6-digit numeric OTP code
    const otp = process.env.NODE_ENV === 'test' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis/Memory for 5 minutes (300 seconds)
    const otpKey = `otp:${phoneNumber}`;
    await this.redis.set(otpKey, otp, 300);

    this.logger.log(`OTP generated for ${phoneNumber}: [${otp}]`);

    const response: { message: string; phoneNumber: string; otp?: string } = {
      message: 'OTP sent successfully',
      phoneNumber,
    };

    if (process.env.NODE_ENV !== 'production') {
      response.otp = otp;
    }

    return response;
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const { phoneNumber, otp, fullName, role } = dto;
    const otpKey = `otp:${phoneNumber}`;

    const savedOtp = await this.redis.get(otpKey);
    if (!savedOtp || savedOtp !== otp) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    let user = await this.prisma.user.findUnique({
      where: { phoneNumber },
      include: {
        staffProfile: { include: { salon: true } },
        ownedSalons: true,
      },
    });

    if (user) {
      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive. Please contact support.');
      }
      if (!user.isPhoneVerified) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { isPhoneVerified: true },
          include: {
            staffProfile: { include: { salon: true } },
            ownedSalons: true,
          },
        });
      }
    } else {
      // Allowed roles for self-registration: CUSTOMER, CLIENT, SALON_OWNER, STAFF, SALON_STAFF
      const allowedRoles: UserRole[] = [
        UserRole.CUSTOMER,
        UserRole.CLIENT,
        UserRole.SALON_OWNER,
        UserRole.STAFF,
        UserRole.SALON_STAFF,
      ];
      const selectedRole = role && allowedRoles.includes(role) ? role : UserRole.CUSTOMER;

      const randomPassword = Math.random().toString(36).slice(-10);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.user.create({
        data: {
          phoneNumber,
          fullName: fullName || 'AuraUser',
          role: selectedRole,
          passwordHash,
          isPhoneVerified: true,
          isActive: true,
        },
        include: {
          staffProfile: { include: { salon: true } },
          ownedSalons: true,
        },
      });
    }

    // Clear OTP after successful verification
    await this.redis.del(otpKey);

    const { salonId, salonStatus } = this.extractSalonInfo(user);
    const tokens = this.generateToken(user.id, user.phoneNumber, user.role, salonId, salonStatus);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async register(dto: RegisterDto): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const { phoneNumber, password, fullName, email, role } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (existingUser) {
      throw new ConflictException('Phone number is already registered');
    }

    if (email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new ConflictException('Email address is already registered');
      }
    }

    const allowedRoles: UserRole[] = [
      UserRole.CUSTOMER,
      UserRole.CLIENT,
      UserRole.SALON_OWNER,
      UserRole.STAFF,
      UserRole.SALON_STAFF,
    ];
    const selectedRole = role && allowedRoles.includes(role) ? role : UserRole.CUSTOMER;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        phoneNumber,
        fullName,
        email: email || null,
        passwordHash,
        role: selectedRole,
        isPhoneVerified: false,
        isActive: true,
      },
      include: {
        staffProfile: { include: { salon: true } },
        ownedSalons: true,
      },
    });

    const { salonId, salonStatus } = this.extractSalonInfo(user);
    const tokens = this.generateToken(user.id, user.phoneNumber, user.role, salonId, salonStatus);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async partnerRegister(
    dto: PartnerRegisterDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: any; salon: any }> {
    const {
      ownerFullName,
      phoneNumber,
      password,
      email,
      salonName,
      address,
      subCity,
      tradeLicenseUrl,
      tinNumber,
      kebeleIdUrl,
      payoutBank,
      payoutAccount,
    } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });
    if (existingUser) {
      throw new ConflictException('Phone number is already registered');
    }

    if (email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new ConflictException('Email address is already registered');
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create User as SALON_OWNER and create Salon in PENDING_REVIEW status
    const slug = `${salonName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')}-${Date.now().toString(36)}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phoneNumber,
          fullName: ownerFullName,
          email: email || null,
          passwordHash,
          role: UserRole.SALON_OWNER,
          isPhoneVerified: false,
          isActive: true,
        },
      });

      const salon = await tx.salon.create({
        data: {
          ownerId: user.id,
          name: salonName,
          slug,
          address,
          subCity,
          status: SalonStatus.PENDING_REVIEW,
          isActive: false,
          tradeLicenseUrl: tradeLicenseUrl || null,
          tinNumber: tinNumber || null,
          kebeleIdUrl: kebeleIdUrl || null,
          payoutBank: payoutBank || null,
          payoutAccount: payoutAccount || null,
        },
      });

      return { user, salon };
    });

    const tokens = this.generateToken(
      result.user.id,
      result.user.phoneNumber,
      result.user.role,
      result.salon.id,
      result.salon.status,
    );

    return {
      ...tokens,
      user: this.sanitizeUser(result.user),
      salon: result.salon,
    };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const inputKey = dto.identifier || dto.phoneNumber;

    if (!inputKey) {
      throw new BadRequestException('Please provide a phone number or email address');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: inputKey },
          { email: inputKey },
        ],
      },
      include: {
        staffProfile: { include: { salon: true } },
        ownedSalons: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid login credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive. Please contact support.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid login credentials');
    }

    const { salonId, salonStatus } = this.extractSalonInfo(user);
    const tokens = this.generateToken(user.id, user.phoneNumber, user.role, salonId, salonStatus);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          staffProfile: { include: { salon: true } },
          ownedSalons: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const { salonId, salonStatus } = this.extractSalonInfo(user);
      return this.generateToken(user.id, user.phoneNumber, user.role, salonId, salonStatus);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        staffProfile: { include: { salon: true } },
        ownedSalons: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return this.sanitizeUser(user);
  }

  private extractSalonInfo(user: any): { salonId?: string; salonStatus?: SalonStatus } {
    if (user.ownedSalons && user.ownedSalons.length > 0) {
      return {
        salonId: user.ownedSalons[0].id,
        salonStatus: user.ownedSalons[0].status,
      };
    }
    if (user.staffProfile && user.staffProfile.salon) {
      return {
        salonId: user.staffProfile.salon.id,
        salonStatus: user.staffProfile.salon.status,
      };
    }
    return {};
  }

  private generateToken(
    userId: string,
    phoneNumber: string,
    role: UserRole,
    salonId?: string,
    salonStatus?: SalonStatus,
  ): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      sub: userId,
      phoneNumber,
      role,
      salonId,
      salonStatus,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any): any {
    const { passwordHash: _passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
