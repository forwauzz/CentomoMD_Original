const { Client } = require('pg');
const fs = require('fs');

async function runCasesMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🔍 Reading cases migration file...');
    const migrationSQL = fs.readFileSync('./drizzle/0002_tidy_cargill.sql', 'utf8');
    console.log('✅ Migration file read');

    console.log('🔍 Running cases migration...');
    await client.query(migrationSQL);
    console.log('✅ Cases migration completed successfully');

    // Test the migration by checking if tables exist
    console.log('🔍 Verifying tables exist...');
    
    const casesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cases'
      );
    `);
    console.log('📊 Cases table exists:', casesCheck.rows[0]?.exists || false);

    const sessionsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sessions'
      );
    `);
    console.log('📊 Sessions table exists:', sessionsCheck.rows[0]?.exists || false);

    const usersCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    console.log('📊 Users table exists:', usersCheck.rows[0]?.exists || false);

    console.log('🎉 Migration verification completed');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

runCasesMigration();
