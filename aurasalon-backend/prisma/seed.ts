import {
  PrismaClient,
  UserRole,
  SalonStatus,
  Prisma,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://aurasalon_user:aurasalon_password@localhost:5433/aurasalon_db?schema=public';

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('===========================================================');
  console.log('🌱 Starting AuraSalon Database Seeding (10 Real Studios)');
  console.log('===========================================================\n');

  // 1. Reset Existing Data in Reverse Dependency Order
  console.log('🧹 1. Resetting existing data in reverse dependency order...');
  await prisma.paymentWebhookLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.appointmentService.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.workingHours.deleteMany();
  await prisma.service.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.salon.deleteMany();
  await prisma.user.deleteMany();
  console.log('   ✅ Database successfully wiped.\n');

  // Password hashing
  const saltRounds = 10;
  const superAdminPasswordHash = await bcrypt.hash('AdminPass123!', saltRounds);
  const ownerPasswordHash = await bcrypt.hash('OwnerPass123!', saltRounds);
  const staffPasswordHash = await bcrypt.hash('StaffPass123!', saltRounds);
  const customerPasswordHash = await bcrypt.hash('CustomerPass123!', saltRounds);

  // 2. Super Admin Account
  console.log('👑 2. Creating Super Admin account...');
  const superAdmin = await prisma.user.create({
    data: {
      fullName: 'AuraSalon Operations HQ',
      email: 'admin@aurasalon.com',
      phoneNumber: '+251911000000',
      role: UserRole.SUPER_ADMIN,
      passwordHash: superAdminPasswordHash,
      isPhoneVerified: true,
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
  });
  console.log(`   ✅ Super Admin created: ${superAdmin.fullName}\n`);

  // 3. Realistic Salons & Owners across Sub-Cities
  console.log('🏪 3. Creating 10 Realistic Salons & Owners across Addis Ababa...');

  // Owner 1: Tigist Haile (Multi-location Owner: Bole & Sarbet)
  const owner1 = await prisma.user.create({
    data: {
      fullName: 'Tigist Haile',
      phoneNumber: '+251911111111',
      email: 'tigist@queensaba.et',
      role: UserRole.SALON_OWNER,
      passwordHash: ownerPasswordHash,
      isPhoneVerified: true,
      isActive: true,
    },
  });

  // 1. Queen Saba Luxury Lounge (Bole) - Verified & Featured
  const salon1 = await prisma.salon.create({
    data: {
      id: 'b045c798-6815-41fd-b784-a97c2e6aaeb0',
      ownerId: owner1.id,
      name: 'Queen Saba Luxury Lounge',
      slug: 'queen-saba-luxury-lounge',
      description: 'Experience refined Ethiopian beauty and holistic wellness sanctuary care in the heart of Bole. Featuring bespoke braiding, organic spa treatments, and master hair styling.',
      address: 'Bole Medhanialem, Next to Atlas Hotel, Addis Ababa',
      subCity: 'Bole',
      city: 'Addis Ababa',
      latitude: 8.9982,
      longitude: 38.7865,
      status: SalonStatus.APPROVED,
      tinNumber: '0012345678',
      payoutBank: 'Telebirr / CBE Bank Account',
      payoutAccount: '1000123456789',
      isFeatured: true,
      isActive: true,
      coverImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      ],
    },
  });

  // 2. Queen Saba VIP Spa & Wellness (Sarbet) - Verified & Featured
  const salon2 = await prisma.salon.create({
    data: {
      id: 'fb3144c4-186e-4d26-a58b-181ccdddf5bb',
      ownerId: owner1.id,
      name: 'Queen Saba VIP Spa & Wellness',
      slug: 'queen-saba-vip-spa-wellness',
      description: 'Luxury spa retreat in Sarbet featuring private VIP suites, Moroccan baths, and holistic wellness therapy.',
      address: 'Sarbet, Near South Africa Embassy & Vatican, Addis Ababa',
      subCity: 'Sarbet',
      city: 'Addis Ababa',
      latitude: 8.9912,
      longitude: 38.745,
      status: SalonStatus.APPROVED,
      tinNumber: '0012345679',
      payoutBank: 'Telebirr / CBE',
      payoutAccount: '1000998877665',
      isFeatured: true,
      isActive: true,
      coverImageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      ],
    },
  });

  // Owner 2: Dawit Kebede
  const owner2 = await prisma.user.create({
    data: {
      fullName: 'Dawit Kebede',
      phoneNumber: '+251922222222',
      email: 'dawit@kazanchisglam.et',
      role: UserRole.SALON_OWNER,
      passwordHash: ownerPasswordHash,
      isPhoneVerified: true,
      isActive: true,
    },
  });

  // 3. Kazanchis Glamour Studio (Kazanchis) - Verified & Featured
  const salon3 = await prisma.salon.create({
    data: {
      id: '356cab1e-59de-43cb-971f-fc87403f933e',
      ownerId: owner2.id,
      name: 'Kazanchis Glamour Studio',
      slug: 'kazanchis-glamour-studio',
      description: 'Modern urban studio in Kazanchis business district providing silk press, gel nail art, facial treatments, and executive haircuts.',
      address: 'Kazanchis, Near Inter Luxury Hotel & UNECA, Addis Ababa',
      subCity: 'Kazanchis',
      city: 'Addis Ababa',
      latitude: 9.018,
      longitude: 38.7675,
      status: SalonStatus.APPROVED,
      tinNumber: '0087654321',
      payoutBank: 'Awash Bank Account',
      payoutAccount: '0087654321987',
      isFeatured: true,
      isActive: true,
      coverImageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      ],
    },
  });

  // Owner 3: Yared Tadesse
  const owner3 = await prisma.user.create({
    data: {
      fullName: 'Yared Tadesse',
      phoneNumber: '+251944444444',
      email: 'yared@habeshagrooming.et',
      role: UserRole.SALON_OWNER,
      passwordHash: ownerPasswordHash,
      isPhoneVerified: true,
      isActive: true,
    },
  });

  // 4. Habesha Executive Gentlemen Grooming (Old Airport) - Verified & Featured
  const salon4 = await prisma.salon.create({
    data: {
      id: 'b9ec9cd1-a938-46b4-8c5a-f5284d0fcce6',
      ownerId: owner3.id,
      name: 'Habesha Executive Gentlemen Grooming',
      slug: 'habesha-executive-gentlemen-grooming',
      description: 'Addis Ababa’s premiere executive barbering studio in Old Airport. Hot towel shaves, precision fade cuts, and beard charcoal treatments.',
      address: 'Old Airport, Opp. ICS International School, Addis Ababa',
      subCity: 'Old Airport',
      city: 'Addis Ababa',
      latitude: 8.98,
      longitude: 38.74,
      status: SalonStatus.APPROVED,
      tinNumber: '0044444444',
      payoutBank: 'Telebirr',
      payoutAccount: '+251944444444',
      isFeatured: true,
      isActive: true,
      coverImageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
    },
  });

  // Owner 4: Makeda Assefa
  const owner4 = await prisma.user.create({
    data: {
      fullName: 'Makeda Assefa',
      phoneNumber: '+251933333333',
      email: 'makeda@sarbetbeauty.et',
      role: UserRole.SALON_OWNER,
      passwordHash: ownerPasswordHash,
      isPhoneVerified: true,
      isActive: true,
    },
  });

  // 5. Sarbet Beauty Bar (Sarbet) - Verified, Organic (isFeatured: false)
  const salon5 = await prisma.salon.create({
    data: {
      id: 'fb06a2b5-8083-49d5-94ec-31fc318cd028',
      ownerId: owner4.id,
      name: 'Sarbet Beauty Bar',
      slug: 'sarbet-beauty-bar',
      description: 'Boutique beauty bar in Sarbet specializing in premium silk press treatments, spa facials, nail artistry, and organic hair rituals.',
      address: 'Sarbet, Near South Africa Embassy, Addis Ababa',
      subCity: 'Sarbet',
      city: 'Addis Ababa',
      latitude: 8.995,
      longitude: 38.735,
      status: SalonStatus.APPROVED,
      tinNumber: '0045678910',
      payoutBank: 'Telebirr',
      payoutAccount: '+251933333333',
      isFeatured: false,
      isActive: true,
      coverImageUrl: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80',
    },
  });

  // Owner 5: Bethlehem Worku
  const owner5 = await prisma.user.create({
    data: {
      fullName: 'Bethlehem Worku',
      phoneNumber: '+251977777771',
      email: 'bethlehem@oldairportnails.et',
      role: UserRole.SALON_OWNER,
      passwordHash: ownerPasswordHash,
      isPhoneVerified: true,
      isActive: true,
    },
  });

  // 6. Old Airport Spa & Nails (Old Airport) - Verified, Organic (isFeatured: false)
  const salon6 = await prisma.salon.create({
    data: {
      id: '4867a6c0-e63b-43b2-923e-2d6311d9d95b',
      ownerId: owner5.id,
      name: 'Old Airport Spa & Nails',
      slug: 'old-airport-spa-nails',
      description: 'Serene neighborhood salon in Old Airport offering deluxe gel manicures, natural botanical pedicures, and revitalizing face masks.',
      address: 'Old Airport, Near Golf Club Road, Addis Ababa',
      subCity: 'Old Airport',
      city: 'Addis Ababa',
      latitude: 8.978,
      longitude: 38.742,
      status: SalonStatus.APPROVED,
      tinNumber: '0055555555',
      payoutBank: 'Telebirr',
      payoutAccount: '+251977777771',
      isFeatured: false,
      isActive: true,
      coverImageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1200&q=80',
    },
  });

  // Owner 6: Meseret Desta
  const owner6 = await prisma.user.create({
    data: {
      fullName: 'Meseret Desta',
      phoneNumber: '+251977777772',
      email: 'meseret@luxeglow.et',
      role: UserRole.SALON_OWNER,
      passwordHash: ownerPasswordHash,
      isPhoneVerified: true,
      isActive: true,
    },
  });

  // 7. Luxe Glow Haven (Gerji) - UNVERIFIED (PENDING_REVIEW), Organic
  const salon7 = await prisma.salon.create({
    data: {
      id: 'cd74af67-4fc5-406e-ba5c-544ea0bed42f',
      ownerId: owner6.id,
      name: 'Luxe Glow Haven (Gerji)',
      slug: 'luxe-glow-haven-gerji',
      description: 'New neighborhood beauty studio in Gerji offering modern hair styling, braiding, and express facials. Currently undergoing platform verification audit.',
      address: 'Gerji, Near Roba Bakery & Sunshine Real Estate, Addis Ababa',
      subCity: 'Gerji',
      city: 'Addis Ababa',
      latitude: 9.002,
      longitude: 38.805,
      status: SalonStatus.PENDING_REVIEW, // Demonstrates Unverified status
      tinNumber: '0077777772',
      payoutBank: 'Telebirr',
      payoutAccount: '+251977777772',
      isFeatured: false,
      isActive: true,
      coverImageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80',
    },
  });

  // Owner 7: Eleni Kebede
  const owner7 = await prisma.user.create({
    data: {
      fullName: 'Eleni Kebede',
      phoneNumber: '+251977777773',
      email: 'eleni@elenibotanical.et',
      role: UserRole.SALON_OWNER,
      passwordHash: ownerPasswordHash,
      isPhoneVerified: true,
      isActive: true,
    },
  });

  // 8. Eleni Botanical Hair & Spa (CMC) - Verified & Featured
  const salon8 = await prisma.salon.create({
    data: {
      id: '07c5286a-457f-4a79-9ca0-d373a14cae01',
      ownerId: owner7.id,
      name: 'Eleni Botanical Hair & Spa (CMC)',
      slug: 'eleni-botanical-hair-spa-cmc',
      description: 'Premier holistic wellness and botanical hair studio in CMC. Famous for cold-pressed castor oil scalps, organic clay facials, and silk styling.',
      address: 'CMC, Near Michael Roundabout, Addis Ababa',
      subCity: 'CMC',
      city: 'Addis Ababa',
      latitude: 9.025,
      longitude: 38.835,
      status: SalonStatus.APPROVED,
      tinNumber: '0077777773',
      payoutBank: 'Telebirr / Awash',
      payoutAccount: '+251977777773',
      isFeatured: true,
      isActive: true,
      coverImageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=80',
    },
  });

  // Owner 8: Fikadu Bekele
  const owner8 = await prisma.user.create({
    data: {
      fullName: 'Fikadu Bekele',
      phoneNumber: '+251977777774',
      email: 'fikadu@aradaheritage.et',
      role: UserRole.SALON_OWNER,
      passwordHash: ownerPasswordHash,
      isPhoneVerified: true,
      isActive: true,
    },
  });

  // 9. Arada Heritage Barber & Traditional Lounge (Piassa) - UNVERIFIED (PENDING_REVIEW), Organic
  const salon9 = await prisma.salon.create({
    data: {
      id: 'b93daf7c-080e-4a03-847f-9a1289f799ce',
      ownerId: owner8.id,
      name: 'Arada Heritage Barber & Traditional Lounge',
      slug: 'arada-heritage-barber-traditional-lounge',
      description: 'Vintage community grooming and traditional hair cutting shop in historic Piassa. Specializing in hot towel beard shaves and classic skin tapers.',
      address: 'Piassa, De Gaulle Square, Churchill Avenue, Addis Ababa',
      subCity: 'Piassa',
      city: 'Addis Ababa',
      latitude: 9.035,
      longitude: 38.752,
      status: SalonStatus.PENDING_REVIEW, // Demonstrates Unverified status
      tinNumber: '0077777774',
      payoutBank: 'Telebirr',
      payoutAccount: '+251977777774',
      isFeatured: false,
      isActive: true,
      coverImageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80',
    },
  });

  // Owner 9: Genet Alemu
  const owner9 = await prisma.user.create({
    data: {
      fullName: 'Genet Alemu',
      phoneNumber: '+251977777775',
      email: 'genet@addisurban.et',
      role: UserRole.SALON_OWNER,
      passwordHash: ownerPasswordHash,
      isPhoneVerified: true,
      isActive: true,
    },
  });

  // 10. Addis Urban Beauty Studio (Mexico) - Verified, Organic
  const salon10 = await prisma.salon.create({
    data: {
      id: 'aeb19a3f-8c5e-4ada-b1ee-434b2411b7a9',
      ownerId: owner9.id,
      name: 'Addis Urban Beauty Studio (Mexico)',
      slug: 'addis-urban-beauty-studio-mexico',
      description: 'Chic express beauty parlor located in Mexico Square commercial zone, serving busy professionals with express blowouts, gel polish, and brow threading.',
      address: 'Mexico Square, K-Kare Building, Addis Ababa',
      subCity: 'Mexico',
      city: 'Addis Ababa',
      latitude: 9.01,
      longitude: 38.745,
      status: SalonStatus.APPROVED,
      tinNumber: '0077777775',
      payoutBank: 'CBE Birr',
      payoutAccount: '+251977777775',
      isFeatured: false,
      isActive: true,
      coverImageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
    },
  });

  const allSalons = [
    salon1,
    salon2,
    salon3,
    salon4,
    salon5,
    salon6,
    salon7,
    salon8,
    salon9,
    salon10,
  ];

  console.log('   ✅ 10 Salons created across Bole, Sarbet, Kazanchis, Old Airport, Gerji, CMC, Piassa, and Mexico.\n');

  // 4. Create Shift Schedules (Working Hours) for all 10 Salons
  console.log('⏰ 4. Attaching working hours schedule to each salon...');
  for (const s of allSalons) {
    for (let day = 0; day <= 6; day++) {
      await prisma.workingHours.create({
        data: {
          salonId: s.id,
          dayOfWeek: day,
          openTime: day === 0 ? '10:00' : '08:30',
          closeTime: day === 0 ? '18:00' : '20:00',
          isClosed: false,
        },
      });
    }
  }
  console.log('   ✅ Working hours schedules attached.\n');

  // 5. Create Services for all 10 Salons
  console.log('💈 5. Attaching realistic services & categories to each salon...');
  const standardServicesSpec = [
    {
      name: 'Royal Silk Press & Treatment',
      description: 'Thermal straightening and silk press with deep hydration hair protein treatment.',
      durationMin: 60,
      priceETB: new Prisma.Decimal('1200.00'),
      categoryName: 'Hair Care & Styling',
    },
    {
      name: 'Gel Manicure & Nail Art',
      description: 'Full nail shaping, cuticles, exfoliating scrub, long-lasting gel polish, and custom nail art.',
      durationMin: 45,
      priceETB: new Prisma.Decimal('800.00'),
      categoryName: 'Nail & Hand Care',
    },
    {
      name: 'Gold Glow Facial Spa',
      description: 'Deep pore cleansing, steam extraction, exfoliating mask, and 24k gold infused hydrating facial.',
      durationMin: 90,
      priceETB: new Prisma.Decimal('2500.00'),
      categoryName: 'Facial & Spa Therapy',
    },
    {
      name: "Gentlemen's Executive Haircut & Beard Trim",
      description: 'Precision haircut, skin fade, hot towel shave, and sculptured beard trimming with premium oils.',
      durationMin: 45,
      priceETB: new Prisma.Decimal('600.00'),
      categoryName: 'Barber & Grooming',
    },
  ];

  const salonServicesMap = new Map<string, Map<string, any>>();

  for (const s of allSalons) {
    const sMap = new Map<string, any>();

    const hairCat = await prisma.category.create({
      data: { salonId: s.id, name: 'Hair Care & Styling', sortOrder: 1 },
    });
    const nailCat = await prisma.category.create({
      data: { salonId: s.id, name: 'Nail & Hand Care', sortOrder: 2 },
    });
    const spaCat = await prisma.category.create({
      data: { salonId: s.id, name: 'Facial & Spa Therapy', sortOrder: 3 },
    });
    const barberCat = await prisma.category.create({
      data: { salonId: s.id, name: 'Barber & Grooming', sortOrder: 4 },
    });

    const categoryMap: Record<string, string> = {
      'Hair Care & Styling': hairCat.id,
      'Nail & Hand Care': nailCat.id,
      'Facial & Spa Therapy': spaCat.id,
      'Barber & Grooming': barberCat.id,
    };

    for (const spec of standardServicesSpec) {
      const createdService = await prisma.service.create({
        data: {
          salonId: s.id,
          categoryId: categoryMap[spec.categoryName],
          name: spec.name,
          description: spec.description,
          durationMin: spec.durationMin,
          priceETB: spec.priceETB,
          isActive: true,
        },
      });
      sMap.set(spec.name, createdService);
    }
    salonServicesMap.set(s.id, sMap);
  }

  // Attach specialized Ethiopian Botanical Rituals specifically to Eleni Botanical Hair & Spa (salon8)
  const botanicalCat = await prisma.category.create({
    data: { salonId: salon8.id, name: 'Ethiopian Botanical Rituals', sortOrder: 5 },
  });
  await prisma.service.create({
    data: {
      salonId: salon8.id,
      categoryId: botanicalCat.id,
      name: 'Ethiopian Botanical Scalp & Hair Steaming',
      description: 'Pure Argan and cold-pressed Ethiopian Koba oil steaming therapy for intense hair growth.',
      durationMin: 75,
      priceETB: new Prisma.Decimal('1750.00'),
      isActive: true,
    },
  });
  await prisma.service.create({
    data: {
      salonId: salon8.id,
      categoryId: botanicalCat.id,
      name: 'Herbal Hot Koba Oil Full Body Massage',
      description: 'Warm sesame and eucalyptus oil full body massage tailored for total muscle rejuvenation.',
      durationMin: 90,
      priceETB: new Prisma.Decimal('3400.00'),
      isActive: true,
    },
  });
  console.log('   ✅ 4 standard services created for each salon + Ethiopian Botanical Rituals attached to Eleni.\n');

  // 6. Specialist Staff Members
  console.log('👩‍🔬 6. Creating staff profiles for salons...');
  const staffSpecs = [
    // Salon 1: Queen Saba Luxury Lounge (Bole)
    {
      id: 'st-bole-1',
      salonId: salon1.id,
      fullName: 'Selamawit Tadesse',
      phoneNumber: '+251921111111',
      title: 'Senior Hair Stylist & Silk Press Specialist',
      bio: 'Over 8 years experience in bespoke natural hair care.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'st-bole-2',
      salonId: salon1.id,
      fullName: 'Eden Assefa',
      phoneNumber: '+251921111112',
      title: 'Spa & Nail Esthetician',
      bio: 'Expert in deluxe gel manicures and gold facials.',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'st-bole-3',
      salonId: salon1.id,
      fullName: 'Abebe Bikila',
      phoneNumber: '+251921111113',
      title: 'Master Grooming Specialist',
      bio: 'Specialist in precision fades and beard sculpting.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },

    // Salon 2: Queen Saba VIP Spa & Wellness (Sarbet)
    {
      id: 'st-sarbet-1',
      salonId: salon2.id,
      fullName: 'Meron Assefa',
      phoneNumber: '+251921111114',
      title: 'Lead Spa & Moroccan Bath Therapist',
      bio: 'Certified hammam and holistic wellness therapist.',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'st-sarbet-2',
      salonId: salon2.id,
      fullName: 'Tigist Haile',
      phoneNumber: '+251921111124',
      title: 'Holistic Wellness & Deep Tissue Specialist',
      bio: 'Specialist in hot volcanic stone massage and herbal wraps.',
      avatarUrl: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=300&q=80',
    },

    // Salon 3: Kazanchis Glamour Studio (Kazanchis)
    {
      id: 'st-kaz-1',
      salonId: salon3.id,
      fullName: 'Bethlehem Girma',
      phoneNumber: '+251921111123',
      title: 'Master Bridal Makeup Artist',
      bio: 'Editorial and bridal glamour with 7+ years expertise.',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'st-kaz-2',
      salonId: salon3.id,
      fullName: 'Tewodros Kassaye',
      phoneNumber: '+251921111115',
      title: 'Executive Barber',
      bio: 'High-end styling and hot towel beard conditioning.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },

    // Salon 4: Habesha Executive Gentlemen Grooming (Old Airport)
    {
      id: 'st-hab-1',
      salonId: salon4.id,
      fullName: 'Yared Alemu',
      phoneNumber: '+251921111116',
      title: 'Executive Barber & Director',
      bio: 'Master barbering with 10+ years experience.',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'st-hab-2',
      salonId: salon4.id,
      fullName: 'Fitsum Mengistu',
      phoneNumber: '+251921111125',
      title: 'Hot Towel Beard Sculpting Specialist',
      bio: 'Precision straight-razor shaving and facial massage.',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    },

    // Salon 5: Sarbet Beauty Bar (Sarbet)
    {
      id: 'st-sbb-1',
      salonId: salon5.id,
      fullName: 'Helen Moges',
      phoneNumber: '+251921111117',
      title: 'Pedicure & Reflexology Specialist',
      bio: 'Volcanic stone spa pedicures and reflexology.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'st-sbb-2',
      salonId: salon5.id,
      fullName: 'Samrawit Bekele',
      phoneNumber: '+251921111126',
      title: 'Classic Blowout & Hair Care Specialist',
      bio: 'Expert blowout styling and deep moisture conditioning.',
      avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80',
    },

    // Salon 6: Old Airport Spa & Nails (Old Airport)
    {
      id: 'st-oa-1',
      salonId: salon6.id,
      fullName: 'Kidist Tefera',
      phoneNumber: '+251921111118',
      title: 'Senior Nail Artist',
      bio: 'Russian manicures and luxury nail art.',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'st-oa-2',
      salonId: salon6.id,
      fullName: 'Senait Desta',
      phoneNumber: '+251921111127',
      title: 'Aromatherapy & Facial Specialist',
      bio: 'Certified organic facial treatments and botanical exfoliation.',
      avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=300&q=80',
    },

    // Salon 7: Luxe Glow Haven (Gerji)
    {
      id: 'st-lg-1',
      salonId: salon7.id,
      fullName: 'Meseret Desta',
      phoneNumber: '+251921111119',
      title: 'Braider & Hair Stylist',
      bio: 'Knotless box braids and organic oil treatments.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'st-lg-2',
      salonId: salon7.id,
      fullName: 'Kalkidan Abebe',
      phoneNumber: '+251921111128',
      title: 'Skin Glow & Hydration Esthetician',
      bio: 'Herbal steam therapy and hydration glow treatments.',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    },

    // Salon 8: Eleni Botanical Hair & Spa (CMC)
    {
      id: 'st-eleni-1',
      salonId: salon8.id,
      fullName: 'Eleni Kebede',
      phoneNumber: '+251921111120',
      title: 'Master Botanical Director',
      bio: 'Cold-pressed castor and koba oil steam therapy.',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'st-eleni-2',
      salonId: salon8.id,
      fullName: 'Martha Girma',
      phoneNumber: '+251921111129',
      title: 'Organic Herbal Steam & Scalp Therapist',
      bio: 'Traditional Ethiopian koba oil infusion and scalp care.',
      avatarUrl: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=300&q=80',
    },

    // Salon 9: Arada Heritage Barber & Traditional Lounge (Piassa)
    {
      id: 'st-arada-1',
      salonId: salon9.id,
      fullName: 'Fikadu Bekele',
      phoneNumber: '+251921111121',
      title: 'Master Traditional Barber',
      bio: 'Heritage grooming and traditional razor styling.',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'st-arada-2',
      salonId: salon9.id,
      fullName: 'Tesfaye Lemma',
      phoneNumber: '+251921111130',
      title: 'Heritage Razor Shave Specialist',
      bio: 'Vintage hot towel straight-razor shave and head massage.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },

    // Salon 10: Addis Urban Beauty Studio (Mexico)
    {
      id: 'st-mex-1',
      salonId: salon10.id,
      fullName: 'Genet Alemu',
      phoneNumber: '+251921111122',
      title: 'Senior Hair & Brow Stylist',
      bio: 'Modern hair architecture and brow threading.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'st-mex-2',
      salonId: salon10.id,
      fullName: 'Hiwot Kassaye',
      phoneNumber: '+251921111131',
      title: 'Modern Hair Architect & Colorist',
      bio: 'Balayage, ombre, and contemporary architectural haircuts.',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    },
  ];

  for (const st of staffSpecs) {
    const user = await prisma.user.create({
      data: {
        fullName: st.fullName,
        phoneNumber: st.phoneNumber,
        email: `${st.fullName.toLowerCase().replace(/\s+/g, '.')}@aurasalon.et`,
        role: UserRole.STAFF,
        passwordHash: staffPasswordHash,
        avatarUrl:
          (st as any).avatarUrl ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        isPhoneVerified: true,
        isActive: true,
      },
    });

    const sMap = salonServicesMap.get(st.salonId);
    const firstService = sMap ? Array.from(sMap.values())[0] : null;

    await prisma.staffProfile.create({
      data: {
        id: st.id,
        userId: user.id,
        salonId: st.salonId,
        title: st.title,
        bio: st.bio,
        isAvailable: true,
        services: firstService ? { connect: [{ id: firstService.id }] } : undefined,
      },
    });
  }
  console.log('   ✅ Specialist staff profiles created and assigned.\n');

  // 7. Clean Customer Accounts (Blen Worku & Kaleb Solomon)
  console.log('👥 7. Creating Test Customer Accounts...');
  const customer1 = await prisma.user.create({
    data: {
      fullName: 'Blen Worku',
      phoneNumber: '+251955555555',
      email: 'blen@gmail.com',
      role: UserRole.CLIENT,
      passwordHash: customerPasswordHash,
      isPhoneVerified: true,
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      fullName: 'Kaleb Solomon',
      phoneNumber: '+251966666666',
      email: 'kaleb@gmail.com',
      role: UserRole.CLIENT,
      passwordHash: customerPasswordHash,
      isPhoneVerified: true,
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      fullName: 'Almaz Tadesse',
      phoneNumber: '+251911234567',
      email: 'almaz.tadesse@gmail.com',
      role: UserRole.CLIENT,
      passwordHash: customerPasswordHash,
      isPhoneVerified: true,
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    },
  });
  console.log('   ✅ Test customer accounts created (0 previous appointments).\n');

  // 8. Seeding Summary
  console.log('===========================================================');
  console.log('📊 DATABASE SEEDING COMPLETE (10 REAL STUDIOS IN POSTGRESQL)');
  console.log('===========================================================');
  console.table(
    allSalons.map((s) => ({
      ID: s.id,
      Name: s.name,
      District: s.subCity,
      Verified: s.status === SalonStatus.APPROVED ? '✓ Yes (APPROVED)' : 'Pending (UNVERIFIED)',
      Featured: s.isFeatured ? '★ Yes (FEATURED)' : 'No (Organic)',
    }))
  );
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
