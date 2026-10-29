export type SubCity = 'Bole' | 'Kazanchis' | 'Piassa' | 'Old Airport' | 'Sarbet';

export interface Service {
  id: string;
  salonId: string;
  categoryId: string;
  name: string;
  description: string;
  durationMin: number;
  priceETB: number;
  categoryName?: string;
}

export interface StaffProfile {
  id: string;
  fullName: string;
  title: string;
  avatarUrl: string;
  rating: number;
  isAvailable: boolean;
}

export interface WorkingHours {
  day: string; // e.g. "Monday - Saturday"
  time: string; // e.g. "08:30 AM - 08:00 PM"
}

export interface Salon {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  subCity: SubCity;
  city: string;
  rating: number;
  reviewCount: number;
  coverImageUrl: string;
  gallery: string[];
  isVerified: boolean;
  isFeatured: boolean;
  priceRange: string;
  services: Service[];
  staff: StaffProfile[];
  workingHours: WorkingHours;
}

export type PaymentMethod = 'TELEBIRR' | 'CBE_BIRR' | 'CHAPA' | 'PAY_AT_SALON';

export type AppointmentStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  bookingCode: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  salonId: string;
  salonName: string;
  salonAddress: string;
  salonCoverImage: string;
  services: Service[];
  staffName?: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // e.g. "10:30 AM"
  totalPriceETB: number;
  status: AppointmentStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PENDING' | 'SUCCESSFUL';
  qrCodeUrl?: string;
  createdAt: string;
}
