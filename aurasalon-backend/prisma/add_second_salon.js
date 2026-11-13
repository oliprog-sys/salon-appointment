const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://aurasalon_user:aurasalon_password@localhost:5433/aurasalon_db?schema=public'
});

async function run() {
  try {
    // 1. Find Tigist Haile
    const userRes = await pool.query(`SELECT id, "fullName", email FROM users WHERE email = 'tigist@queensaba.et';`);
    if (userRes.rows.length === 0) {
      console.error('Tigist Haile not found');
      return;
    }
    const tigist = userRes.rows[0];

    // Check if salon already created in previous run
    let salonId;
    const existingSalon = await pool.query(`SELECT id, name FROM salons WHERE slug = 'queen-saba-vip-spa-wellness';`);
    if (existingSalon.rows.length > 0) {
      salonId = existingSalon.rows[0].id;
      console.log('Salon already exists:', existingSalon.rows[0]);
    } else {
      const salonInsert = await pool.query(`
        INSERT INTO salons (
          id, "ownerId", name, slug, description, address, "subCity", city,
          latitude, longitude, status, "tinNumber", "payoutBank", "payoutAccount",
          "isFeatured", "isActive", "coverImageUrl", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          $1,
          'Queen Saba VIP Spa & Wellness',
          'queen-saba-vip-spa-wellness',
          'Luxury spa retreat in Sarbet featuring private VIP suites, Moroccan baths, and holistic wellness therapy.',
          'Sarbet, near Vatican Embassy, Addis Ababa',
          'Sarbet',
          'Addis Ababa',
          8.9912,
          38.7450,
          'APPROVED',
          '0012345679',
          'Telebirr / CBE',
          '1000998877665',
          true,
          true,
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
          NOW(),
          NOW()
        ) RETURNING id, name, "subCity";
      `, [tigist.id]);
      salonId = salonInsert.rows[0].id;
      console.log('Created second salon:', salonInsert.rows[0]);

      // Add Working Hours (7 days)
      for (let day = 0; day <= 6; day++) {
        await pool.query(`
          INSERT INTO working_hours (id, "salonId", "dayOfWeek", "openTime", "closeTime", "isClosed")
          VALUES (gen_random_uuid(), $1, $2, '08:30', '20:00', false)
          ON CONFLICT DO NOTHING;
        `, [salonId, day]);
      }
    }

    // 4. Create Category (without createdAt/updatedAt)
    let catId;
    const existingCat = await pool.query(`SELECT id FROM categories WHERE "salonId" = $1;`, [salonId]);
    if (existingCat.rows.length > 0) {
      catId = existingCat.rows[0].id;
    } else {
      const catRes = await pool.query(`
        INSERT INTO categories (id, "salonId", name, "sortOrder")
        VALUES (gen_random_uuid(), $1, 'Luxury Spa & Massage', 1)
        RETURNING id;
      `, [salonId]);
      catId = catRes.rows[0].id;
    }

    // Add Services
    await pool.query(`
      INSERT INTO services (id, "salonId", "categoryId", name, description, "durationMin", "priceETB", "isActive", "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), $1, $2, 'Royal Moroccan Bath & Scrub', 'Traditional steam bath with black olive soap, full body exfoliation, and relaxing argan oil rinse.', 75, 2200.00, true, NOW(), NOW()),
        (gen_random_uuid(), $1, $2, 'Aromatherapy Deep Tissue Massage', 'Full body 60-minute therapeutic massage with organic essential oils to relieve tension.', 60, 1800.00, true, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `, [salonId, catId]);
    console.log('Added Services for Branch 2');

    // 5. Create Specialist Staff (Rahel Bekele) if not exists
    const existingStaffUser = await pool.query(`SELECT id FROM users WHERE email = 'rahel@queensaba.et';`);
    let staffUserId;
    if (existingStaffUser.rows.length > 0) {
      staffUserId = existingStaffUser.rows[0].id;
    } else {
      const bcrypt = require('c:/Users/hp/Documents/Works/AuraSalon/aurasalon-backend/node_modules/bcrypt');
      const staffHash = await bcrypt.hash('StaffPass123!', 10);
      const staffUserRes = await pool.query(`
        INSERT INTO users (
          id, "fullName", "phoneNumber", email, role, "passwordHash", "isPhoneVerified", "isActive", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          'Rahel Bekele',
          '+251921999999',
          'rahel@queensaba.et',
          'STAFF',
          $1,
          true,
          true,
          NOW(),
          NOW()
        ) RETURNING id;
      `, [staffHash]);
      staffUserId = staffUserRes.rows[0].id;
    }

    const existingProfile = await pool.query(`SELECT id FROM staff_profiles WHERE "userId" = $1;`, [staffUserId]);
    if (existingProfile.rows.length === 0) {
      await pool.query(`
        INSERT INTO staff_profiles (id, "userId", "salonId", title, bio, "isAvailable", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          'Senior Spa & Massage Therapist',
          'Certified Moroccan bath and aromatherapy specialist. Working Shift: Mon-Sat 09:00 - 18:00.',
          true,
          NOW(),
          NOW()
        );
      `, [staffUserId, salonId]);
      console.log('Assigned Specialist Staff Rahel Bekele to Queen Saba VIP Spa & Wellness');
    }

    // 6. Verify all salons for Tigist Haile
    const allTigistSalons = await pool.query(`SELECT id, name, "subCity", status FROM salons WHERE "ownerId" = $1 ORDER BY name;`, [tigist.id]);
    console.log("All Salons owned by Tigist Haile:", allTigistSalons.rows);

  } catch (err) {
    console.error('Error adding second salon:', err);
  } finally {
    await pool.end();
  }
}

run();
