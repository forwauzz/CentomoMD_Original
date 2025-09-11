const { Client } = require('pg');

async function createMockProfile() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    const mockUserId = '00000000-0000-0000-0000-000000000001';
    
    console.log('🔍 Creating mock profile...');
    const result = await client.query(`
      INSERT INTO profiles (user_id, display_name, locale, consent_pipeda, consent_marketing)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        locale = EXCLUDED.locale,
        consent_pipeda = EXCLUDED.consent_pipeda,
        consent_marketing = EXCLUDED.consent_marketing,
        updated_at = NOW()
      RETURNING *
    `, [mockUserId, 'Dev User', 'fr-CA', false, false]);
    
    console.log('✅ Mock profile created/updated:', result.rows[0]);

    // Verify the profile exists
    const verify = await client.query('SELECT * FROM profiles WHERE user_id = $1', [mockUserId]);
    console.log('📊 Profile verification:', verify.rows[0]);

  } catch (error) {
    console.error('❌ Error creating mock profile:', error.message);
  } finally {
    await client.end();
  }
}

createMockProfile();
