import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function countCases() {
  try {
    console.log('🔍 Connecting to database...');
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable not set');
      return;
    }
    
    const sql = postgres(process.env.DATABASE_URL, {
      max: 1,
      connect_timeout: 10,
    });
    
    console.log('✅ Database connection successful');
    
    // Count total cases
    console.log('🔍 Counting cases...');
    const result = await sql`SELECT COUNT(*) as count FROM cases`;
    const count = result[0].count;
    
    console.log(`📊 Total cases in database: ${count}`);
    
    if (count > 0) {
      // Get some sample data
      const sampleResult = await sql`SELECT * FROM cases LIMIT 3`;
      console.log('\n📋 Sample case data:');
      sampleResult.forEach((case_, index) => {
        console.log(`Case ${index + 1}:`, {
          uid: case_.uid,
          user_id: case_.user_id,
          clinic_id: case_.clinic_id,
          has_draft: case_.draft !== null,
          created_at: case_.created_at
        });
      });
      
      // Show some statistics
      const withDraft = await sql`SELECT COUNT(*) as count FROM cases WHERE draft IS NOT NULL`;
      const withoutDraft = count - withDraft[0].count;
      
      console.log(`\n📈 Statistics:`);
      console.log(`- Cases with draft data: ${withDraft[0].count}`);
      console.log(`- Cases without draft data: ${withoutDraft}`);
      
      // Show date range
      const dateRange = await sql`SELECT MIN(created_at) as earliest, MAX(created_at) as latest FROM cases`;
      console.log(`- Date range: ${dateRange[0].earliest} to ${dateRange[0].latest}`);
    }
    
    await sql.end();
    
  } catch (error) {
    console.error('❌ Error counting cases:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

countCases();
