/**
 * Run template_combinations table migration
 * This script runs the SQL migration to create the template_combinations table
 */

import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!url) {
  console.error('❌ DATABASE_URL or SUPABASE_DB_URL not found in environment');
  process.exit(1);
}

console.log('🔍 Connecting to database...');
const sql = postgres(url, {
  ssl: 'require',
  prepare: false
});

async function runMigration() {
  try {
    console.log('🚀 Running template_combinations migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'drizzle', '0006_add_template_combinations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sql.unsafe(statement);
          console.log(`✅ Executed: ${statement.split('\n')[0]?.substring(0, 60) || 'Unknown statement'}...`);
        } catch (error: any) {
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`ℹ️  Already exists, skipping...`);
          } else {
            console.error(`❌ Error executing statement: ${error.message}`);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Template combinations migration completed successfully');
    
    // Verify table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'template_combinations'
      );
    `;
    
    if (tableCheck[0]?.exists) {
      console.log('✅ Verified: template_combinations table exists');
    } else {
      console.error('❌ Warning: template_combinations table not found after migration');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run migration if executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { runMigration };

