export type AppointmentStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  timeSlot: string; // e.g. "09:00 AM"
  durationMinutes: number;
  priceETB: number;
  status: AppointmentStatus;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface ServiceOffering {
  id: string;
  name: string;
  category: 'HAIR' | 'NAILS' | 'SPA' | 'BARBER';
  durationMinutes: number;
  priceETB: number;
  description: string;
  isActive: boolean;
  assignedStaffIds: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  phone: string;
  specialties: string[];
  workingHours: string; // e.g. "08:30 AM - 05:30 PM"
  status: 'ON_SHIFT' | 'ON_BREAK' | 'OFF_DUTY';
  rating: number;
  totalBookingsToday: number;
}
