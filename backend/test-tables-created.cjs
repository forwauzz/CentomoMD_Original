const { Client } = require('pg');

async function testTablesCreated() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Check if tables exist
    console.log('🔍 Checking if tables exist...');
    
    const tables = ['cases', 'sessions', 'users', 'transcripts'];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      console.log(`📊 ${table} table exists:`, result.rows[0]?.exists || false);
    }

    // Try to insert a test case
    console.log('\n🔍 Testing case insertion...');
    try {
      const insertResult = await client.query(`
        INSERT INTO cases (id, user_id, draft) 
        VALUES ($1, $2, $3) 
        RETURNING id
      `, ['test-case-123', '9dc87840-75b8-4bd0-8ec1-85d2a2c2e804', '{}']);
      
      console.log('✅ Case insertion successful:', insertResult.rows[0]?.id);
      
      // Clean up test case
      await client.query('DELETE FROM cases WHERE id = $1', ['test-case-123']);
      console.log('✅ Test case cleaned up');
      
    } catch (insertError) {
      console.log('❌ Case insertion failed:', insertError.message);
    }

    // Try to insert a test session
    console.log('\n🔍 Testing session insertion...');
    try {
      const insertResult = await client.query(`
        INSERT INTO sessions (id, user_id, patient_id, status, mode, current_section) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id
      `, ['test-session-123', '9dc87840-75b8-4bd0-8ec1-85d2a2c2e804', 'test-patient', 'active', 'smart_dictation', 'section_7']);
      
      console.log('✅ Session insertion successful:', insertResult.rows[0]?.id);
      
      // Clean up test session
      await client.query('DELETE FROM sessions WHERE id = $1', ['test-session-123']);
      console.log('✅ Test session cleaned up');
      
    } catch (insertError) {
      console.log('❌ Session insertion failed:', insertError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await client.end();
  }
}

testTablesCreated();
