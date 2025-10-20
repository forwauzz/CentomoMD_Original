const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkSupabaseStructure() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n📋 Reading SQL query file...');
    const sqlQuery = fs.readFileSync(path.resolve(__dirname, './check-supabase-structure.sql'), 'utf8');
    
    console.log('🔍 Executing read-only queries...');
    const result = await client.query(sqlQuery);
    
    console.log('\n📊 Supabase Database Structure:');
    console.log('=====================================');
    
    // The query returns multiple result sets, let's parse them
    if (result.rows && result.rows.length > 0) {
      console.log('\n1. Tables in public schema:');
      result.rows.forEach(row => {
        console.log(`   - ${row.table_name} (${row.table_type})`);
      });
    }
    
    console.log('\n✅ Database structure check completed');
    console.log('\n💡 Key findings:');
    console.log('   - This will show us the current table structure');
    console.log('   - Foreign key relationships between sessions/cases and users/profiles');
    console.log('   - Whether the users table has any data');
    console.log('   - Current constraint names that need to be updated');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    if (error.message.includes('SASL')) {
      console.log('\n💡 This might be a database connection issue. Check your DATABASE_URL in .env');
    }
  } finally {
    await client.end();
  }
}

checkSupabaseStructure();
