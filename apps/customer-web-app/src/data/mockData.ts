import { Salon, Appointment } from '../types';

export const MOCK_SALONS: Salon[] = [
  {
    id: 's1',
    name: 'Aura Luxe Sanctuary',
    slug: 'aura-luxe-sanctuary',
    description: 'Experience refined Ethiopian beauty and holistic wellness in the heart of Bole. Featuring bespoke braiding, organic spa treatments, and master hair styling.',
    address: 'Bole Medhanialem, Next to Atlas Hotel',
    subCity: 'Bole',
    city: 'Addis Ababa',
    rating: 4.9,
    reviewCount: 128,
    coverImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80'
    ],
    isVerified: true,
    isFeatured: true,
    priceRange: 'ETB 800 - 3,500',
    workingHours: {
      day: 'Monday - Saturday',
      time: '08:30 AM - 08:30 PM'
    },
    staff: [
      {
        id: 'st1',
        fullName: 'Selamawit Tadesse',
        title: 'Master Braider & Hair Artist',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        rating: 5.0,
        isAvailable: true
      },
      {
        id: 'st2',
        fullName: 'Tigist Hailu',
        title: 'Senior Aesthetician & Skin Care Specialist',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        rating: 4.9,
        isAvailable: true
      },
      {
        id: 'st3',
        fullName: 'Dawit Bekele',
        title: 'Luxury Nail Specialist',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        rating: 4.8,
        isAvailable: true
      }
    ],
    services: [
      {
        id: 'srv1',
        salonId: 's1',
        categoryId: 'c1',
        categoryName: 'Hair Braiding & Artistry',
        name: 'Signature Full Box Braids',
        description: 'Meticulously crafted box braids with organic hair nourishment oil and precision parting.',
        durationMin: 180,
        priceETB: 2200
      },
      {
        id: 'srv2',
        salonId: 's1',
        categoryId: 'c1',
        categoryName: 'Hair Braiding & Artistry',
        name: 'Crown Cornrow Artistry',
        description: 'Traditional and modern hybrid cornrows tailored to your unique head silhouette.',
        durationMin: 120,
        priceETB: 1600
      },
      {
        id: 'srv3',
        salonId: 's1',
        categoryId: 'c2',
        categoryName: 'Luxury Spa & Massage',
        name: 'Aroma-Herbal Deep Tissue Massage',
        description: 'Full-body relaxation infused with local Ethiopian botanicals and eucalyptus steam session.',
        durationMin: 90,
        priceETB: 3200
      },
      {
        id: 'srv4',
        salonId: 's1',
        categoryId: 'c4',
        categoryName: 'Nails & Manicure',
        name: 'Gold Leaf Deluxe Gel Manicure',
        description: 'Exfoliating hand treatment with gel polish and 24k gold leaf accents.',
        durationMin: 60,
        priceETB: 1200
      }
    ]
  },
  {
    id: 's2',
    name: 'Queen Saba Beauty Lounge',
    slug: 'queen-saba-beauty-lounge',
    description: 'A sanctuary dedicated to royal pampering in Kazanchis. Specializing in bridal makeup, hair steam treatments, and traditional Ethiopian honey wraps.',
    address: 'Kazanchis, Near UNECA Main Entrance',
    subCity: 'Kazanchis',
    city: 'Addis Ababa',
    rating: 4.8,
    reviewCount: 94,
    coverImageUrl: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80'
    ],
    isVerified: true,
    isFeatured: true,
    priceRange: 'ETB 600 - 4,000',
    workingHours: {
      day: 'Everyday',
      time: '09:00 AM - 08:00 PM'
    },
    staff: [
      {
        id: 'st4',
        fullName: 'Bethlehem Girma',
        title: 'Master Bridal Makeup Artist',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        rating: 4.9,
        isAvailable: true
      },
      {
        id: 'st5',
        fullName: 'Rahel Assefa',
        title: 'Hair Care & Treatment Specialist',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
        rating: 4.8,
        isAvailable: true
      }
    ],
    services: [
      {
        id: 'srv5',
        salonId: 's2',
        categoryId: 'c5',
        categoryName: 'Skin & Facial',
        name: 'Royal Honey & Coffee Glow Facial',
        description: 'Deep pore cleansing utilizing pure Sidama honey and highland coffee exfoliation.',
        durationMin: 75,
        priceETB: 1900
      },
      {
        id: 'srv6',
        salonId: 's2',
        categoryId: 'c1',
        categoryName: 'Hair Braiding & Artistry',
        name: 'Keratin Silk Press & Style',
        description: 'Thermal straightening treatment ensuring glossy, featherlight natural hair movement.',
        durationMin: 90,
        priceETB: 2500
      }
    ]
  },
  {
    id: 's3',
    name: 'Habesha Executive Gentlemen Grooming',
    slug: 'habesha-executive-gentlemen-grooming',
    description: 'Addis Ababa’s premiere executive barbering studio in Old Airport. Hot towel shaves, precision fade cuts, and beard charcoal treatments.',
    address: 'Old Airport, Opp. ICS International School',
    subCity: 'Old Airport',
    city: 'Addis Ababa',
    rating: 4.9,
    reviewCount: 156,
    coverImageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80'
    ],
    isVerified: true,
    isFeatured: true,
    priceRange: 'ETB 500 - 2,200',
    workingHours: {
      day: 'Monday - Sunday',
      time: '08:00 AM - 09:00 PM'
    },
    staff: [
      {
        id: 'st6',
        fullName: 'Yared Alemu',
        title: 'Executive Barber & Styling Director',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        rating: 5.0,
        isAvailable: true
      }
    ],
    services: [
      {
        id: 'srv7',
        salonId: 's3',
        categoryId: 'c3',
        categoryName: 'Barber & Grooming',
        name: 'The Executive Cut & Beard Sculpt',
        description: 'Precision haircut, hot towel facial massage, beard lineup, and organic balm conditioning.',
        durationMin: 60,
        priceETB: 1100
      },
      {
        id: 'srv8',
        salonId: 's3',
        categoryId: 'c3',
        categoryName: 'Barber & Grooming',
        name: 'Royal Black Charcoal Facial & Cut',
        description: 'Deep black mask pore extraction accompanied by full styling and scalp massage.',
        durationMin: 75,
        priceETB: 1600
      }
    ]
  },
  {
    id: 's4',
    name: 'Piassa Vintage Beauty House',
    slug: 'piassa-vintage-beauty-house',
    description: 'Combining historic charm with modern aesthetic perfection in Piassa. Specializing in Afro styling, spa pedicures, and body therapy.',
    address: 'Piassa, Churchill Avenue Commercial Center',
    subCity: 'Piassa',
    city: 'Addis Ababa',
    rating: 4.7,
    reviewCount: 74,
    coverImageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80'
    ],
    isVerified: true,
    isFeatured: false,
    priceRange: 'ETB 450 - 2,800',
    workingHours: {
      day: 'Monday - Saturday',
      time: '09:00 AM - 07:30 PM'
    },
    staff: [
      {
        id: 'st7',
        fullName: 'Helen Moges',
        title: 'Pedicure & Reflexology Specialist',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        rating: 4.7,
        isAvailable: true
      }
    ],
    services: [
      {
        id: 'srv9',
        salonId: 's4',
        categoryId: 'c4',
        categoryName: 'Nails & Manicure',
        name: 'Volcanic Stone Spa Pedicure',
        description: 'Warm volcanic stone foot massage with aromatic scrub and gel polish finish.',
        durationMin: 60,
        priceETB: 1300
      }
    ]
  },
  {
    id: 's5',
    name: 'Sarbet Velvet Nail & Lash Bar',
    slug: 'sarbet-velvet-nail-lash-bar',
    description: 'Boutique beauty studio in Sarbet offering luxury lash extensions, acrylic nail extensions, and precision brows.',
    address: 'Sarbet, Near South Africa Embassy',
    subCity: 'Sarbet',
    city: 'Addis Ababa',
    rating: 4.9,
    reviewCount: 112,
    coverImageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80'
    ],
    isVerified: true,
    isFeatured: true,
    priceRange: 'ETB 700 - 3,200',
    workingHours: {
      day: 'Tuesday - Sunday',
      time: '09:30 AM - 08:00 PM'
    },
    staff: [
      {
        id: 'st8',
        fullName: 'Hiwot Kassa',
        title: 'Master Lash Artist',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        rating: 4.9,
        isAvailable: true
      }
    ],
    services: [
      {
        id: 'srv10',
        salonId: 's5',
        categoryId: 'c5',
        categoryName: 'Skin & Facial',
        name: 'Volume Cashmere Lash Extension',
        description: 'Featherlight Russian volume lashes with 4-week durability guarantee.',
        durationMin: 120,
        priceETB: 2800
      }
    ]
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-101',
    bookingCode: 'AURA-9842',
    salonId: 's1',
    salonName: 'Aura Luxe Sanctuary',
    salonAddress: 'Bole Medhanialem, Next to Atlas Hotel',
    salonCoverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
    services: [
      {
        id: 'srv1',
        salonId: 's1',
        categoryId: 'c1',
        name: 'Signature Full Box Braids',
        description: 'Meticulously crafted box braids with organic hair nourishment oil',
        durationMin: 180,
        priceETB: 2200
      }
    ],
    staffName: 'Selamawit Tadesse',
    appointmentDate: '2026-10-05',
    appointmentTime: '10:30 AM',
    totalPriceETB: 2200,
    status: 'CONFIRMED',
    paymentMethod: 'TELEBIRR',
    paymentStatus: 'SUCCESSFUL',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=AURA-9842',
    createdAt: '2026-10-02T14:30:00Z'
  },
  {
    id: 'app-102',
    bookingCode: 'AURA-4119',
    salonId: 's3',
    salonName: 'Habesha Executive Gentlemen Grooming',
    salonAddress: 'Old Airport, Opp. ICS International School',
    salonCoverImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
    services: [
      {
        id: 'srv7',
        salonId: 's3',
        categoryId: 'c3',
        name: 'The Executive Cut & Beard Sculpt',
        description: 'Precision haircut, hot towel facial massage',
        durationMin: 60,
        priceETB: 1100
      }
    ],
    staffName: 'Yared Alemu',
    appointmentDate: '2026-09-28',
    appointmentTime: '02:00 PM',
    totalPriceETB: 1100,
    status: 'COMPLETED',
    paymentMethod: 'CBE_BIRR',
    paymentStatus: 'SUCCESSFUL',
    createdAt: '2026-09-25T11:00:00Z'
  }
];
