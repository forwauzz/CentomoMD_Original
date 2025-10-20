// Test using the same database connection as the backend
import { getDb } from './src/database/connection.ts';

async function testBackendConnection() {
  try {
    console.log('🔍 Testing backend database connection...');
    
    const db = getDb();
    console.log('✅ Database connection obtained');
    
    // Test if we can query existing tables
    console.log('🔍 Testing existing tables...');
    
    // Check profiles table (we know this works from logs)
    const profilesResult = await db.execute('SELECT COUNT(*) as count FROM profiles LIMIT 1');
    console.log('✅ Profiles table accessible:', profilesResult.rows[0]?.count || 'unknown');
    
    // Check if cases table exists
    try {
      const casesResult = await db.execute('SELECT COUNT(*) as count FROM cases LIMIT 1');
      console.log('✅ Cases table accessible:', casesResult.rows[0]?.count || 'unknown');
    } catch (error) {
      console.log('❌ Cases table error:', error.message);
    }
    
    // Check if sessions table exists
    try {
      const sessionsResult = await db.execute('SELECT COUNT(*) as count FROM sessions LIMIT 1');
      console.log('✅ Sessions table accessible:', sessionsResult.rows[0]?.count || 'unknown');
    } catch (error) {
      console.log('❌ Sessions table error:', error.message);
    }
    
    // Try to insert a test case
    console.log('\n🔍 Testing case insertion...');
    try {
      const testCaseId = `test-case-${Date.now()}`;
      const insertResult = await db.execute(`
        INSERT INTO cases (id, user_id, draft) 
        VALUES ($1, $2, $3) 
        RETURNING id
      `, [testCaseId, '9dc87840-75b8-4bd0-8ec1-85d2a2c2e804', '{}']);
      
      console.log('✅ Case insertion successful:', insertResult.rows[0]?.id);
      
      // Clean up
      await db.execute('DELETE FROM cases WHERE id = $1', [testCaseId]);
      console.log('✅ Test case cleaned up');
      
    } catch (error) {
      console.log('❌ Case insertion failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Backend connection test failed:', error.message);
  }
}

testBackendConnection();
