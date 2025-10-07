const { getDb } = require('./dist/src/database/connection.js');
const { profiles } = require('./dist/src/database/schema.js');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    const db = getDb();
    console.log('✅ Database connection successful');
    
    // Test if profiles table exists
    console.log('🔍 Checking profiles table...');
    const result = await db.select().from(profiles).limit(1);
    console.log('✅ Profiles table exists');
    console.log('📊 Table structure:', result.length > 0 ? Object.keys(result[0]) : 'No data found');
    
    // Test inserting a mock profile
    console.log('🔍 Testing profile creation...');
    const mockProfile = {
      user_id: 'dev-user-id',
      display_name: 'Dev User',
      locale: 'fr-CA',
      consent_pipeda: false,
      consent_marketing: false
    };
    
    const insertResult = await db.insert(profiles).values(mockProfile).returning();
    console.log('✅ Profile created successfully:', insertResult[0]);
    
    // Test reading the profile
    console.log('🔍 Testing profile read...');
    const readResult = await db.select().from(profiles).where(eq(profiles.user_id, 'dev-user-id'));
    console.log('✅ Profile read successfully:', readResult[0]);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDatabase();
