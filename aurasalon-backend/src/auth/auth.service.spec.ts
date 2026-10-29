import { BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuthService } from './auth.service';

type MockUserDelegate = {
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
};

type MockPrismaService = {
  user: MockUserDelegate;
};

type MockRedisService = {
  set: jest.Mock;
  get: jest.Mock;
  del: jest.Mock;
};

type MockJwtService = {
  sign: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: MockPrismaService;
  let mockRedis: MockRedisService;
  let mockJwtService: MockJwtService;

  const mockUser = {
    id: 'user-uuid-1',
    phoneNumber: '+251912345678',
    fullName: 'Abebe Bikila',
    role: UserRole.CUSTOMER,
    passwordHash: '$2b$10$hashedpassword',
    isPhoneVerified: true,
    isActive: true,
    staffProfile: null,
    ownedSalons: [],
  };

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    mockRedis = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(undefined),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mocked-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestOtp', () => {
    it('should generate and save OTP in Redis', async () => {
      const result = await service.requestOtp({ phoneNumber: '+251912345678' });
      expect(result.message).toBe('OTP sent successfully');
      expect(result.phoneNumber).toBe('+251912345678');
      expect(mockRedis.set).toHaveBeenCalledWith('otp:+251912345678', expect.any(String), 300);
    });
  });

  describe('verifyOtp', () => {
    it('should throw BadRequestException if OTP is invalid', async () => {
      mockRedis.get.mockResolvedValue('654321');
      await expect(
        service.verifyOtp({ phoneNumber: '+251912345678', otp: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create new user and return JWT if valid OTP and user does not exist', async () => {
      mockRedis.get.mockResolvedValue('123456');
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await service.verifyOtp({
        phoneNumber: '+251912345678',
        otp: '123456',
        fullName: 'Abebe Bikila',
        role: UserRole.CUSTOMER,
      });

      expect(result.accessToken).toBe('mocked-jwt-token');
      expect(result.user.phoneNumber).toBe('+251912345678');
      expect(result.user.passwordHash).toBeUndefined();
    });
  });

  describe('register', () => {
    it('should throw ConflictException if phone number exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(
        service.register({
          phoneNumber: '+251912345678',
          password: 'password123',
          fullName: 'Abebe Bikila',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
