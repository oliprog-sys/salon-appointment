import { UserRole, SalonStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  phoneNumber: string;
  role: UserRole;
  salonId?: string;
  salonStatus?: SalonStatus;
}
