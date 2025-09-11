const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🔍 Reading migration file...');
    const migrationSQL = fs.readFileSync('./drizzle/0002_profile_fixes.sql', 'utf8');
    console.log('✅ Migration file read');

    console.log('🔍 Running migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully');

    // Test the migration by checking if RLS is enabled
    console.log('🔍 Verifying migration...');
    const rlsCheck = await client.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename = 'profiles'
    `);
    console.log('📊 RLS status:', rlsCheck.rows);

    // Check if policies exist
    const policiesCheck = await client.query(`
      SELECT policyname, cmd, qual 
      FROM pg_policies 
      WHERE tablename = 'profiles'
    `);
    console.log('📊 Policies:', policiesCheck.rows);

    // Check if trigger exists
    const triggerCheck = await client.query(`
      SELECT tgname, tgtype 
      FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created'
    `);
    console.log('📊 Trigger:', triggerCheck.rows);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

runMigration();
