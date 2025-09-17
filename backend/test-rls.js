// Test RLS setup for Phase 5
import { getSql } from './src/database/connection.js';

async function testRLS() {
  const sql = getSql();
  
  try {
    console.log('🔧 Setting up RLS for Phase 5 testing...');
    
    // 1. Enable RLS on profiles table
    console.log('1. Enabling RLS on profiles table...');
    await sql`ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`;
    console.log('✅ RLS enabled on profiles table');
    
    // 2. Create a simple RLS policy for testing (without auth.uid())
    console.log('2. Creating test RLS policy...');
    await sql`
      CREATE POLICY "test_users_can_view_own_profile" ON profiles
      FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::uuid)
    `;
    console.log('✅ Test RLS policy created');
    
    // 3. Insert test data
    console.log('3. Inserting test profiles...');
    const testProfiles = [
      { user_id: '11111111-1111-1111-1111-111111111111', display_name: 'Test User 1', locale: 'en-CA' },
      { user_id: '22222222-2222-2222-2222-222222222222', display_name: 'Test User 2', locale: 'fr-CA' },
      { user_id: '33333333-3333-3333-3333-333333333333', display_name: 'Test User 3', locale: 'en-CA' }
    ];
    
    for (const profile of testProfiles) {
      await sql`
        INSERT INTO profiles (user_id, display_name, locale, consent_pipeda, consent_marketing)
        VALUES (${profile.user_id}, ${profile.display_name}, ${profile.locale}, true, false)
        ON CONFLICT (user_id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          locale = EXCLUDED.locale
      `;
    }
    console.log('✅ Test profiles inserted');
    
    // 4. Verify RLS is enabled
    console.log('4. Verifying RLS status...');
    const rlsStatus = await sql`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname='public' and tablename='profiles'
    `;
    console.log('📊 RLS Status:', rlsStatus[0]);
    
    // 5. Test row count
    const countResult = await sql`SELECT COUNT(*)::int as cnt FROM profiles`;
    console.log('📊 Total profiles:', countResult[0].cnt);
    
    console.log('🎉 RLS setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up RLS:', error);
  } finally {
    await sql.end();
  }
}

testRLS();
