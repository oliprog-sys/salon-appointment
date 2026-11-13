const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://aurasalon_user:aurasalon_password@localhost:5433/aurasalon_db?schema=public'
});

const avatarMap = {
  'tigist@queensaba.et': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
  'selamawit@queensaba.et': 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=300&q=80',
  'eden@queensaba.et': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'abebe@queensaba.et': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
  'rahel@queensaba.et': 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=300&q=80',
  'dawit@kazanchisglam.et': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
  'tewodros@kazanchisglam.et': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'bethlehem@kazanchisglam.et': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
  'eyerusalem@kazanchisglam.et': 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80',
  'makeda@sarbetbeauty.et': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
  'helen@sarbetbeauty.et': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  'yonas@sarbetbeauty.et': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'meron@sarbetbeauty.et': 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80',
  'yared@oldairportspa.et': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
  'blen@gmail.com': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'kaleb@gmail.com': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
};

async function run() {
  try {
    for (const [email, avatarUrl] of Object.entries(avatarMap)) {
      await pool.query(`UPDATE users SET "avatarUrl" = $1 WHERE email = $2;`, [avatarUrl, email]);
    }
    console.log('Successfully updated all user profile pictures in database!');
  } catch (err) {
    console.error('Error updating avatars:', err);
  } finally {
    await pool.end();
  }
}

run();

