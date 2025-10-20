// Test database connection and table existence
import { getDb } from './backend/src/database/connection.js';

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    const db = getDb();
    
    // Test basic connectivity
    const testResult = await db.execute('SELECT 1 as test');
    console.log('✅ Database connectivity test passed');
    
    // Check if cases table exists
    const tableCheck = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cases'
      ) as exists
    `);
    
    const tableExists = tableCheck.rows[0]?.exists;
    console.log('📋 Cases table exists:', tableExists);
    
    if (tableExists) {
      // Try to count cases
      const countResult = await db.execute('SELECT COUNT(*) as count FROM cases');
      const caseCount = countResult.rows[0]?.count || 0;
      console.log('📊 Total cases in database:', caseCount);
      
      // Try to get recent cases
      const recentCases = await db.execute(`
        SELECT id, user_id, patient_info, status, created_at, updated_at 
        FROM cases 
        ORDER BY updated_at DESC 
        LIMIT 5
      `);
      
      console.log('📋 Recent cases:', recentCases.rows.length);
      recentCases.rows.forEach((case_, index) => {
        console.log(`   ${index + 1}. ${case_.id} - ${case_.patient_info?.name || 'Unnamed'} (${case_.status})`);
      });
    }
    
    console.log('🎉 Database test completed successfully');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error details:', error.message);
  }
}

testDatabase();
