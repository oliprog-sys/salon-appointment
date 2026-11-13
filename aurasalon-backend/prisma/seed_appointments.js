const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://aurasalon_user:aurasalon_password@localhost:5433/aurasalon_db?schema=public'
});

async function run() {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    // Start times in UTC for today
    const startTime1 = new Date(`${yyyy}-${mm}-${dd}T07:00:00.000Z`); // 10:00 AM East Africa Time (UTC+3)
    const endTime1 = new Date(`${yyyy}-${mm}-${dd}T08:00:00.000Z`);   // 11:00 AM EAT

    const startTime2 = new Date(`${yyyy}-${mm}-${dd}T11:00:00.000Z`); // 02:00 PM EAT
    const endTime2 = new Date(`${yyyy}-${mm}-${dd}T11:45:00.000Z`);   // 02:45 PM EAT

    const salonId = 'b045c798-6815-41fd-b784-a97c2e6aaeb0'; // Queen Saba Luxury Lounge

    // Appointment 1: Blen Worku with Selamawit (IN_PROGRESS)
    const apt1Res = await pool.query(`
      INSERT INTO appointments (
        id, "bookingCode", "customerId", "salonId", "staffId", status, 
        "startTime", "endTime", "subtotalETB", "serviceFeeETB", "totalPriceETB", notes, "updatedAt"
      ) VALUES (
        gen_random_uuid(), 'AURA-QS-01', 'bec6751a-d386-42fa-904e-2118c3ef4bf2', $1,
        '9751b214-d118-4f25-b008-b494d1ec4c2e', 'IN_PROGRESS', $2, $3, 1200.00, 0.00, 1200.00,
        'Client requested deep hydration hair protein treatment.', NOW()
      ) RETURNING id;
    `, [salonId, startTime1, endTime1]);

    const apt1Id = apt1Res.rows[0].id;
    await pool.query(`
      INSERT INTO appointment_services (id, "appointmentId", "serviceId", "priceAtBooking")
      VALUES (gen_random_uuid(), $1, 'bbf2432c-f269-4253-a5fd-5d824424d8b9', 1200.00);
    `, [apt1Id]);

    // Appointment 2: Kaleb Solomon with Abebe Bikila (CONFIRMED)
    const apt2Res = await pool.query(`
      INSERT INTO appointments (
        id, "bookingCode", "customerId", "salonId", "staffId", status, 
        "startTime", "endTime", "subtotalETB", "serviceFeeETB", "totalPriceETB", notes, "updatedAt"
      ) VALUES (
        gen_random_uuid(), 'AURA-QS-02', 'a0ca73f0-10f3-4179-b163-958697f1ebd5', $1,
        '1ce8aa6d-9a81-4422-a403-bd15d393b74b', 'CONFIRMED', $2, $3, 600.00, 0.00, 600.00,
        'Precision fade haircut with hot towel shave.', NOW()
      ) RETURNING id;
    `, [salonId, startTime2, endTime2]);

    const apt2Id = apt2Res.rows[0].id;
    await pool.query(`
      INSERT INTO appointment_services (id, "appointmentId", "serviceId", "priceAtBooking")
      VALUES (gen_random_uuid(), $1, '6b9cfd6e-86a3-481d-be0b-2440ee73bda8', 600.00);
    `, [apt2Id]);

    console.log('Successfully inserted 2 real database appointments for Queen Saba!');
  } catch (err) {
    console.error('Error inserting appointments:', err);
  } finally {
    await pool.end();
  }
}

run();

