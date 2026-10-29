import { Appointment, ServiceOffering, StaffMember } from '../types';

export const INITIAL_SERVICES: ServiceOffering[] = [
  {
    id: 'srv-1',
    name: 'Royal Silk Hair Press & Conditioning',
    category: 'HAIR',
    durationMinutes: 60,
    priceETB: 1200,
    description: 'Deep hydration treatment with high-shine silk press for natural hair.',
    isActive: true,
    assignedStaffIds: ['st-1', 'st-3']
  },
  {
    id: 'srv-2',
    name: 'Habesha Traditional Braids & Loc Styling',
    category: 'HAIR',
    durationMinutes: 90,
    priceETB: 1800,
    description: 'Intricate traditional Ethiopian braided styles with gold bead accents.',
    isActive: true,
    assignedStaffIds: ['st-1']
  },
  {
    id: 'srv-3',
    name: 'Luxury Velvet Gel Manicure & Hand Spa',
    category: 'NAILS',
    durationMinutes: 45,
    priceETB: 850,
    description: 'Full nail shaping, cuticle treatment, organic scrub, and long-lasting gel coating.',
    isActive: true,
    assignedStaffIds: ['st-2']
  },
  {
    id: 'srv-4',
    name: 'Aura Signature Pedicure & Hot Stone Treatment',
    category: 'NAILS',
    durationMinutes: 60,
    priceETB: 1100,
    description: 'Exfoliating botanical foot bath with relaxing hot stone calf massage.',
    isActive: true,
    assignedStaffIds: ['st-2']
  },
  {
    id: 'srv-5',
    name: 'Gold Glow Radiance Facial',
    category: 'SPA',
    durationMinutes: 75,
    priceETB: 2500,
    description: '24K gold infused serum facial tailored for intense glow and cellular rejuvenation.',
    isActive: true,
    assignedStaffIds: ['st-4']
  },
  {
    id: 'srv-6',
    name: 'Deep Tissue Ethiopian Coffee Scrub Therapy',
    category: 'SPA',
    durationMinutes: 60,
    priceETB: 2200,
    description: 'Aromatherapy full body massage using authentic Yirgacheffe coffee scrub.',
    isActive: true,
    assignedStaffIds: ['st-4']
  },
  {
    id: 'srv-7',
    name: 'Executive Gentleman Beard Sculpt & Haircut',
    category: 'BARBER',
    durationMinutes: 45,
    priceETB: 950,
    description: 'Precision hot towel shave, beard oil alignment, and modern fade haircut.',
    isActive: true,
    assignedStaffIds: ['st-3']
  }
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'st-1',
    name: 'Selamawit Tadesse',
    role: 'Master Hair Stylist',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    phone: '+251 91 122 3344',
    specialties: ['Silk Press', 'Habesha Braids', 'Color Correction'],
    workingHours: '08:30 AM - 05:30 PM',
    status: 'ON_SHIFT',
    rating: 4.9,
    totalBookingsToday: 6
  },
  {
    id: 'st-2',
    name: 'Eden Assefa',
    role: 'Senior Nail Artist',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    phone: '+251 92 334 4556',
    specialties: ['Velvet Gel', 'Acrylic Extensions', 'Hot Stone Pedicure'],
    workingHours: '09:00 AM - 06:00 PM',
    status: 'ON_SHIFT',
    rating: 4.85,
    totalBookingsToday: 8
  },
  {
    id: 'st-3',
    name: 'Abel Getachew',
    role: 'Senior Barber & Grooming Specialist',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+251 93 445 5667',
    specialties: ['Precision Fade', 'Executive Beard Sculpt', 'Hair Treatments'],
    workingHours: '08:00 AM - 05:00 PM',
    status: 'ON_SHIFT',
    rating: 4.92,
    totalBookingsToday: 5
  },
  {
    id: 'st-4',
    name: 'Bethlehem Worku',
    role: 'Esthetician & Spa Specialist',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+251 94 556 6778',
    specialties: ['Gold Glow Facial', 'Coffee Body Therapy', 'Deep Tissue'],
    workingHours: '10:00 AM - 07:00 PM',
    status: 'ON_BREAK',
    rating: 4.96,
    totalBookingsToday: 4
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-101',
    customerName: 'Meron Hailu',
    customerPhone: '+251 91 234 5678',
    serviceId: 'srv-1',
    serviceName: 'Royal Silk Hair Press & Conditioning',
    staffId: 'st-1',
    staffName: 'Selamawit Tadesse',
    timeSlot: '09:00 AM',
    durationMinutes: 60,
    priceETB: 1200,
    status: 'IN_PROGRESS',
    date: '2026-10-03',
    notes: 'Prefers heat protectant serum.'
  },
  {
    id: 'apt-102',
    customerName: 'Tigist Bekele',
    customerPhone: '+251 92 987 6543',
    serviceId: 'srv-3',
    serviceName: 'Luxury Velvet Gel Manicure & Hand Spa',
    staffId: 'st-2',
    staffName: 'Eden Assefa',
    timeSlot: '09:30 AM',
    durationMinutes: 45,
    priceETB: 850,
    status: 'CONFIRMED',
    date: '2026-10-03',
    notes: 'Emerald green gel color selected.'
  },
  {
    id: 'apt-103',
    customerName: 'Henok Girma',
    customerPhone: '+251 93 111 2233',
    serviceId: 'srv-7',
    serviceName: 'Executive Gentleman Beard Sculpt & Haircut',
    staffId: 'st-3',
    staffName: 'Abel Getachew',
    timeSlot: '10:00 AM',
    durationMinutes: 45,
    priceETB: 950,
    status: 'CONFIRMED',
    date: '2026-10-03'
  },
  {
    id: 'apt-104',
    customerName: 'Rahel Alemu',
    customerPhone: '+251 94 444 5555',
    serviceId: 'srv-5',
    serviceName: 'Gold Glow Radiance Facial',
    staffId: 'st-4',
    staffName: 'Bethlehem Worku',
    timeSlot: '11:00 AM',
    durationMinutes: 75,
    priceETB: 2500,
    status: 'PENDING',
    date: '2026-10-03',
    notes: 'First time VIP guest.'
  },
  {
    id: 'apt-105',
    customerName: 'Dawit Solomon',
    customerPhone: '+251 91 888 7766',
    serviceId: 'srv-7',
    serviceName: 'Executive Gentleman Beard Sculpt & Haircut',
    staffId: 'st-3',
    staffName: 'Abel Getachew',
    timeSlot: '11:30 AM',
    durationMinutes: 45,
    priceETB: 950,
    status: 'CONFIRMED',
    date: '2026-10-03'
  },
  {
    id: 'apt-106',
    customerName: 'Kalkidan Fikru',
    customerPhone: '+251 92 333 9900',
    serviceId: 'srv-2',
    serviceName: 'Habesha Traditional Braids & Loc Styling',
    staffId: 'st-1',
    staffName: 'Selamawit Tadesse',
    timeSlot: '01:30 PM',
    durationMinutes: 90,
    priceETB: 1800,
    status: 'CONFIRMED',
    date: '2026-10-03'
  },
  {
    id: 'apt-107',
    customerName: 'Yonas Kebede',
    customerPhone: '+251 95 666 1122',
    serviceId: 'srv-4',
    serviceName: 'Aura Signature Pedicure & Hot Stone Treatment',
    staffId: 'st-2',
    staffName: 'Eden Assefa',
    timeSlot: '02:00 PM',
    durationMinutes: 60,
    priceETB: 1100,
    status: 'COMPLETED',
    date: '2026-10-03'
  }
];
