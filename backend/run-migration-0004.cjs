const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🔍 Reading migration file: drizzle/0004_fix_uuid_and_profiles_fk.sql...');
    const migrationSQL = fs.readFileSync(path.resolve(__dirname, './drizzle/0004_fix_uuid_and_profiles_fk.sql'), 'utf8');
    console.log('✅ Migration file read');

    console.log('🔍 Running migration 0004...');
    await client.query(migrationSQL);
    console.log('✅ Migration 0004 completed successfully');

    console.log('🔍 Verifying migration: Checking foreign key constraints...');
    const fkResult = await client.query(`
      SELECT
        tc.constraint_name,
        kcu.table_name  AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name  AS target_table,
        ccu.column_name AS target_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type='FOREIGN KEY'
        AND kcu.table_name IN ('sessions','cases')
      ORDER BY 1;
    `);
    
    console.log('✅ Foreign key constraints:');
    fkResult.rows.forEach(row => {
      console.log(`   ${row.source_table}.${row.source_column} → ${row.target_table}.${row.target_column} (${row.constraint_name})`);
    });

    console.log('🔍 Verifying cases table structure...');
    const casesResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cases' AND column_name IN ('id', 'user_id', 'uid')
      ORDER BY column_name;
    `);
    
    console.log('✅ Cases table columns:');
    casesResult.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('🔍 Checking for orphaned records...');
    const orphanSessions = await client.query(`
      SELECT COUNT(*) as count
      FROM sessions s
      LEFT JOIN profiles p ON p.user_id = s.user_id
      WHERE p.user_id IS NULL;
    `);
    
    const orphanCases = await client.query(`
      SELECT COUNT(*) as count
      FROM cases c
      LEFT JOIN profiles p ON p.user_id = c.user_id
      WHERE c.user_id IS NOT NULL AND p.user_id IS NULL;
    `);
    
    console.log(`✅ Orphaned sessions: ${orphanSessions.rows[0].count}`);
    console.log(`✅ Orphaned cases: ${orphanCases.rows[0].count}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

runMigration();
