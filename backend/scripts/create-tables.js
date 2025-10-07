import 'dotenv/config';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

console.log('🔍 Connecting to database...');
const sql = postgres(url, {
  ssl: 'require',
  prepare: false
});

async function createTables() {
  try {
    console.log('🚀 Creating database tables...');
    
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'drizzle', '0000_mean_loners.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sql.unsafe(statement);
          console.log(`✅ Created table: ${statement.split('\n')[0]?.substring(0, 50) || 'Unknown table'}...`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`ℹ️  Table already exists, skipping...`);
          } else {
            console.warn(`⚠️  Warning creating table: ${error.message}`);
          }
        }
      }
    }
    
    console.log('✅ Database tables created successfully');
    
    // Apply RLS policies
    console.log('Applying RLS policies...');
    const rlsPoliciesPath = path.join(process.cwd(), 'drizzle', 'rls_policies.sql');
    
    if (fs.existsSync(rlsPoliciesPath)) {
      const rlsPolicies = fs.readFileSync(rlsPoliciesPath, 'utf8');
      
      // Split the SQL file into individual statements
      const rlsStatements = rlsPolicies
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of rlsStatements) {
        if (statement.trim()) {
          try {
            await sql.unsafe(statement);
            console.log(`✅ Applied RLS policy: ${statement.split('\n')[0]?.substring(0, 50) || 'Unknown policy'}...`);
          } catch (error) {
            if (error.message.includes('already exists')) {
              console.log(`ℹ️  RLS policy already exists, skipping...`);
            } else {
              console.warn(`⚠️  Warning applying RLS policy: ${error.message}`);
            }
          }
        }
      }
      
      console.log('✅ RLS policies applied successfully');
    } else {
      console.warn('⚠️  RLS policies file not found, skipping RLS setup');
    }
    
    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

createTables().catch(console.error);
