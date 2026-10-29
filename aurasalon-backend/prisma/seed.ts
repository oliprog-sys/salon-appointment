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
  console.log('🌱 Starting AuraSalon Platform Database Seeding');
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

  // Helper for password hashing
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
  console.log(`   ✅ Super Admin created: ${superAdmin.fullName} (${superAdmin.email})\n`);

  // 3. Realistic Salons & Owners across Sub-Cities
  console.log('🏪 3. Creating Salons & Owners across Sub-Cities...');

  // Salon Owner A
  const ownerA = await prisma.user.create({
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

  const salonA = await prisma.salon.create({
    data: {
      ownerId: ownerA.id,
      name: 'Queen Saba Luxury Lounge',
      slug: 'queen-saba-luxury-lounge',
      description: 'Addis Ababa premier luxury beauty lounge offering high-end hair styling, silk press treatments, gel manicures, and facial spa services.',
      address: 'Bole sub-city, near Edna Mall, Addis Ababa',
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
    },
  });

  // Salon Owner B
  const ownerB = await prisma.user.create({
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

  const salonB = await prisma.salon.create({
    data: {
      ownerId: ownerB.id,
      name: 'Kazanchis Glamour Studio',
      slug: 'kazanchis-glamour-studio',
      description: 'Modern urban studio in Kazanchis business district providing silk press, gel nail art, facial treatments, and executive haircuts.',
      address: 'Kazanchis sub-city, near Inter Luxury Hotel, Addis Ababa',
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
      coverImageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
    },
  });

  // Salon Owner C
  const ownerC = await prisma.user.create({
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

  const salonC = await prisma.salon.create({
    data: {
      ownerId: ownerC.id,
      name: 'Sarbet Beauty Bar',
      slug: 'sarbet-beauty-bar',
      description: 'Boutique beauty bar in Sarbet specializing in premium silk press treatments, spa facials, nail artistry, and grooming.',
      address: 'Sarbet sub-city, near South Africa Embassy, Addis Ababa',
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

  // Salon D (Pending Review)
  const ownerD = await prisma.user.create({
    data: {
      fullName: 'Yared Tadesse',
      phoneNumber: '+251944444444',
      email: 'yared@oldairportspa.et',
      role: UserRole.SALON_OWNER,
      passwordHash: ownerPasswordHash,
      isPhoneVerified: true,
      isActive: true,
    },
  });

  const salonD = await prisma.salon.create({
    data: {
      ownerId: ownerD.id,
      name: 'Old Airport Spa & Nails',
      slug: 'old-airport-spa-nails',
      description: 'Upcoming luxury spa and nail boutique in Old Airport neighborhood currently awaiting admin review.',
      address: 'Old Airport sub-city, Addis Ababa',
      subCity: 'Old Airport',
      city: 'Addis Ababa',
      latitude: 8.980,
      longitude: 38.740,
      status: SalonStatus.PENDING_REVIEW,
      tinNumber: '0055555555',
      payoutBank: 'Telebirr',
      payoutAccount: '+251944444444',
      isFeatured: false,
      isActive: true,
      coverImageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    },
  });

  console.log('   ✅ Created 3 APPROVED Salons and 1 PENDING_REVIEW Salon.\n');

  // Create Shift Schedules (Working Hours) for Approved Salons
  const approvedSalons = [salonA, salonB, salonC];
  for (const s of approvedSalons) {
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

  // 4. Realistic Services (ETB Currency) attached to each approved salon
  console.log('💈 4. Attaching realistic ETB services to each approved salon...');

  // Standard service definition template
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

  // Map to store created services per salon: salonId -> Map<serviceName, serviceRecord>
  const salonServicesMap = new Map<string, Map<string, any>>();

  for (const salon of approvedSalons) {
    const serviceMap = new Map<string, any>();
    
    // Create categories first
    const hairCat = await prisma.category.create({
      data: { salonId: salon.id, name: 'Hair Care & Styling', sortOrder: 1 },
    });
    const nailCat = await prisma.category.create({
      data: { salonId: salon.id, name: 'Nail & Hand Care', sortOrder: 2 },
    });
    const spaCat = await prisma.category.create({
      data: { salonId: salon.id, name: 'Facial & Spa Therapy', sortOrder: 3 },
    });
    const barberCat = await prisma.category.create({
      data: { salonId: salon.id, name: 'Barber & Grooming', sortOrder: 4 },
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
          salonId: salon.id,
          categoryId: categoryMap[spec.categoryName],
          name: spec.name,
          description: spec.description,
          durationMin: spec.durationMin,
          priceETB: spec.priceETB,
          isActive: true,
        },
      });
      serviceMap.set(spec.name, createdService);
    }

    salonServicesMap.set(salon.id, serviceMap);
  }
  console.log('   ✅ 4 services attached to each approved salon.\n');

  // 5. Specialist Staff Rosters with assigned specialties & working shift schedules
  console.log('👩‍🔬 5. Creating Specialist Staff Rosters for each approved salon...');

  const staffDefinitions = [
    // Salon A: Queen Saba Luxury Lounge
    {
      salonId: salonA.id,
      fullName: 'Selamawit Tadesse',
      phoneNumber: '+251921111111',
      email: 'selamawit@queensaba.et',
      title: 'Senior Hair Stylist & Silk Press Specialist',
      bio: 'Specializes in Royal Silk Press & Treatment. Working Shift: Mon-Fri 08:30 - 17:00.',
      specialties: ['Royal Silk Press & Treatment', 'Gel Manicure & Nail Art'],
    },
    {
      salonId: salonA.id,
      fullName: 'Eden Assefa',
      phoneNumber: '+251921111112',
      email: 'eden@queensaba.et',
      title: 'Spa & Nail Esthetician',
      bio: 'Specializes in Gel Manicures and Gold Glow Facial Spa. Working Shift: Tue-Sat 09:00 - 18:00.',
      specialties: ['Gel Manicure & Nail Art', 'Gold Glow Facial Spa'],
    },
    {
      salonId: salonA.id,
      fullName: 'Abebe Bikila',
      phoneNumber: '+251921111113',
      email: 'abebe@queensaba.et',
      title: 'Master Grooming Specialist',
      bio: "Specializes in Gentlemen's Executive Cuts & Beard Trimming. Working Shift: Mon-Sat 08:30 - 17:30.",
      specialties: ["Gentlemen's Executive Haircut & Beard Trim"],
    },

    // Salon B: Kazanchis Glamour Studio
    {
      salonId: salonB.id,
      fullName: 'Tewodros Kassaye',
      phoneNumber: '+251927777771',
      email: 'tewodros@kazanchisglam.et',
      title: 'Executive Barber',
      bio: "Specializes in Gentlemen's Executive Haircut & Beard Trim. Working Shift: Mon-Fri 08:30 - 16:30.",
      specialties: ["Gentlemen's Executive Haircut & Beard Trim"],
    },
    {
      salonId: salonB.id,
      fullName: 'Bethlehem Worku',
      phoneNumber: '+251927777772',
      email: 'bethlehem@kazanchisglam.et',
      title: 'Senior Hair Stylist',
      bio: 'Specializes in Royal Silk Press & Hair Care. Working Shift: Tue-Sat 09:30 - 18:00.',
      specialties: ['Royal Silk Press & Treatment', 'Gel Manicure & Nail Art'],
    },
    {
      salonId: salonB.id,
      fullName: 'Eyerusalem Teshale',
      phoneNumber: '+251927777773',
      email: 'eyerusalem@kazanchisglam.et',
      title: 'Lead Facial Esthetician',
      bio: 'Specializes in Gold Glow Facial Spa & Skincare. Working Shift: Mon-Sat 10:00 - 18:00.',
      specialties: ['Gold Glow Facial Spa', 'Gel Manicure & Nail Art'],
    },

    // Salon C: Sarbet Beauty Bar
    {
      salonId: salonC.id,
      fullName: 'Helen Girmay',
      phoneNumber: '+251928888881',
      email: 'helen@sarbetbeauty.et',
      title: 'Master Nail Artist',
      bio: 'Specializes in Gel Manicures & Nail Artistry. Working Shift: Mon-Fri 09:00 - 17:00.',
      specialties: ['Gel Manicure & Nail Art', 'Gold Glow Facial Spa'],
    },
    {
      salonId: salonC.id,
      fullName: 'Yonas Solomon',
      phoneNumber: '+251928888882',
      email: 'yonas@sarbetbeauty.et',
      title: 'Executive Barber & Stylist',
      bio: "Specializes in Gentlemen's Executive Cuts. Working Shift: Tue-Sun 09:00 - 18:00.",
      specialties: ["Gentlemen's Executive Haircut & Beard Trim", 'Royal Silk Press & Treatment'],
    },
    {
      salonId: salonC.id,
      fullName: 'Meron Assefa',
      phoneNumber: '+251928888883',
      email: 'meron@sarbetbeauty.et',
      title: 'Senior Spa & Skincare Therapist',
      bio: 'Specializes in Gold Glow Facial Spa. Working Shift: Mon-Sat 09:30 - 17:30.',
      specialties: ['Gold Glow Facial Spa', 'Royal Silk Press & Treatment'],
    },
  ];

  const seededStaffSummary: any[] = [];

  for (const sDef of staffDefinitions) {
    const user = await prisma.user.create({
      data: {
        fullName: sDef.fullName,
        phoneNumber: sDef.phoneNumber,
        email: sDef.email,
        role: UserRole.STAFF,
        passwordHash: staffPasswordHash,
        isPhoneVerified: true,
        isActive: true,
      },
    });

    const sMap = salonServicesMap.get(sDef.salonId)!;
    const connectIds = sDef.specialties
      .map((specName) => sMap.get(specName)?.id)
      .filter(Boolean)
      .map((id) => ({ id }));

    const profile = await prisma.staffProfile.create({
      data: {
        userId: user.id,
        salonId: sDef.salonId,
        title: sDef.title,
        bio: sDef.bio,
        isAvailable: true,
        services: {
          connect: connectIds,
        },
      },
    });

    seededStaffSummary.push({
      Name: sDef.fullName,
      Title: sDef.title,
      SalonId: sDef.salonId,
      Specialties: sDef.specialties.join(', '),
    });
  }
  console.log('   ✅ Created 9 specialist staff profiles attached to respective salons.\n');

  // 6. Clean Customer Accounts
  console.log('👥 6. Creating Clean Customer Accounts...');
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
  console.log('   ✅ Created test customer accounts: Blen Worku & Kaleb Solomon.\n');

  // 7. Formatted Summary Table Output
  console.log('===========================================================');
  console.log('📊 DATABASE SEEDING SUMMARY');
  console.log('===========================================================\n');

  console.log('--- 1. USERS & ACCOUNTS ---');
  console.table([
    { FullName: superAdmin.fullName, Email: superAdmin.email, Phone: superAdmin.phoneNumber, Role: superAdmin.role },
    { FullName: ownerA.fullName, Email: ownerA.email, Phone: ownerA.phoneNumber, Role: ownerA.role },
    { FullName: ownerB.fullName, Email: ownerB.email, Phone: ownerB.phoneNumber, Role: ownerB.role },
    { FullName: ownerC.fullName, Email: ownerC.email, Phone: ownerC.phoneNumber, Role: ownerC.role },
    { FullName: ownerD.fullName, Email: ownerD.email, Phone: ownerD.phoneNumber, Role: ownerD.role },
    { FullName: customer1.fullName, Email: customer1.email, Phone: customer1.phoneNumber, Role: customer1.role },
    { FullName: customer2.fullName, Email: customer2.email, Phone: customer2.phoneNumber, Role: customer2.role },
  ]);

  console.log('\n--- 2. SALONS ---');
  console.table([
    { SalonName: salonA.name, SubCity: salonA.subCity, Owner: ownerA.fullName, Status: salonA.status, TIN: salonA.tinNumber, Payout: salonA.payoutBank },
    { SalonName: salonB.name, SubCity: salonB.subCity, Owner: ownerB.fullName, Status: salonB.status, TIN: salonB.tinNumber, Payout: salonB.payoutBank },
    { SalonName: salonC.name, SubCity: salonC.subCity, Owner: ownerC.fullName, Status: salonC.status, TIN: salonC.tinNumber, Payout: salonC.payoutBank },
    { SalonName: salonD.name, SubCity: salonD.subCity, Owner: ownerD.fullName, Status: salonD.status, TIN: salonD.tinNumber, Payout: salonD.payoutBank },
  ]);

  console.log('\n--- 3. STANDARD SERVICES (PER APPROVED SALON) ---');
  console.table(
    standardServicesSpec.map((s) => ({
      ServiceName: s.name,
      Category: s.categoryName,
      Duration: `${s.durationMin} mins`,
      Price: `${s.priceETB.toString()} ETB`,
    })),
  );

  console.log('\n--- 4. STAFF ROSTERS & SPECIALTIES ---');
  console.table(
    seededStaffSummary.map((st) => {
      let salonName = '';
      if (st.SalonId === salonA.id) salonName = salonA.name;
      else if (st.SalonId === salonB.id) salonName = salonB.name;
      else if (st.SalonId === salonC.id) salonName = salonC.name;
      return {
        StaffName: st.Name,
        Title: st.Title,
        Salon: salonName,
        Specialties: st.Specialties,
      };
    }),
  );

  console.log('\n🎉 AuraSalon Database Seeded Successfully!');
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
