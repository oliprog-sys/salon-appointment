import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

type MockAuthService = {
  requestOtp: jest.Mock;
  verifyOtp: jest.Mock;
  register: jest.Mock;
  login: jest.Mock;
  getProfile: jest.Mock;
};

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: MockAuthService;

  beforeEach(async () => {
    mockAuthService = {
      requestOtp: jest.fn().mockResolvedValue({ message: 'OTP sent successfully', phoneNumber: '+251912345678' }),
      verifyOtp: jest.fn().mockResolvedValue({ accessToken: 'jwt-token', user: { id: 'user-1' } }),
      register: jest.fn().mockResolvedValue({ accessToken: 'jwt-token', user: { id: 'user-1' } }),
      login: jest.fn().mockResolvedValue({ accessToken: 'jwt-token', user: { id: 'user-1' } }),
      getProfile: jest.fn().mockResolvedValue({ id: 'user-1', phoneNumber: '+251912345678', role: UserRole.CUSTOMER }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestOtp', () => {
    it('should call authService.requestOtp', async () => {
      const res = await controller.requestOtp({ phoneNumber: '+251912345678' });
      expect(mockAuthService.requestOtp).toHaveBeenCalledWith({ phoneNumber: '+251912345678' });
      expect(res.message).toBe('OTP sent successfully');
    });
  });

  describe('verifyOtp', () => {
    it('should call authService.verifyOtp', async () => {
      const res = await controller.verifyOtp({ phoneNumber: '+251912345678', otp: '123456' });
      expect(mockAuthService.verifyOtp).toHaveBeenCalled();
      expect(res.accessToken).toBe('jwt-token');
    });
  });
});
