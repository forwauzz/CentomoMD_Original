// Simple test to get Supabase structure via the debug API endpoint
console.log('🔍 Getting Supabase database structure...');

fetch('http://localhost:3001/api/debug/supabase-structure')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('\n📊 Supabase Database Structure:');
      console.log('=====================================');
      
      console.log('\n1. Tables in public schema:');
      data.data.tables.forEach(table => {
        console.log(`   - ${table.table_name} (${table.table_type})`);
      });
      
      console.log('\n2. Foreign Key Relationships:');
      data.data.foreignKeys.forEach(fk => {
        console.log(`   - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name} (${fk.constraint_name})`);
      });
      
      console.log('\n3. Key Table Columns:');
      const tableColumns = {};
      data.data.columns.forEach(col => {
        if (!tableColumns[col.column_name]) {
          tableColumns[col.column_name] = [];
        }
        tableColumns[col.column_name].push(`${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
      });
      
      // Group by table
      const tables = {};
      data.data.columns.forEach(col => {
        if (!tables[col.table_name]) {
          tables[col.table_name] = [];
        }
        tables[col.table_name].push(col);
      });
      
      Object.keys(tables).forEach(tableName => {
        console.log(`\n   ${tableName}:`);
        tables[tableName].forEach(col => {
          console.log(`     - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
        });
      });
      
      console.log('\n4. Users table count:', data.data.usersCount);
      
      console.log('\n5. Profiles sample data:');
      data.data.profilesSample.forEach(profile => {
        console.log(`   - ${profile.user_id}: ${profile.display_name} (${profile.locale})`);
      });
      
      console.log('\n✅ Database structure analysis completed');
      
      // Check if the issue is what we suspected
      const sessionsFK = data.data.foreignKeys.find(fk => 
        fk.table_name === 'sessions' && fk.column_name === 'user_id'
      );
      const casesFK = data.data.foreignKeys.find(fk => 
        fk.table_name === 'cases' && fk.column_name === 'user_id'
      );
      
      console.log('\n🔍 Foreign Key Analysis:');
      if (sessionsFK) {
        console.log(`   - Sessions.user_id → ${sessionsFK.foreign_table_name}.${sessionsFK.foreign_column_name}`);
        if (sessionsFK.foreign_table_name === 'users') {
          console.log('   ❌ PROBLEM: Sessions references users table, but user_id exists in profiles table');
        } else {
          console.log('   ✅ Sessions correctly references profiles table');
        }
      }
      
      if (casesFK) {
        console.log(`   - Cases.user_id → ${casesFK.foreign_table_name}.${casesFK.foreign_column_name}`);
        if (casesFK.foreign_table_name === 'users') {
          console.log('   ❌ PROBLEM: Cases references users table, but user_id exists in profiles table');
        } else {
          console.log('   ✅ Cases correctly references profiles table');
        }
      }
      
    } else {
      console.error('❌ Failed to get database structure:', data.error);
    }
  })
  .catch(error => {
    console.error('❌ Error calling debug endpoint:', error.message);
  });
