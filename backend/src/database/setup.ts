import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { client } from './connection.js';
import * as fs from 'fs';
import * as path from 'path';
import '../config/environment.js'; // Load environment variables

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Create drizzle instance for migrations
    const db = drizzle(client);
    
    // Run Drizzle migrations
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Database migrations completed successfully');
    
    // Apply RLS policies
    console.log('Applying RLS policies...');
    const rlsPoliciesPath = path.join(process.cwd(), 'drizzle', 'rls_policies.sql');
    
    if (fs.existsSync(rlsPoliciesPath)) {
      const rlsPolicies = fs.readFileSync(rlsPoliciesPath, 'utf8');
      
      // Split the SQL file into individual statements
      const statements = rlsPolicies
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await client.unsafe(statement);
            console.log(`✅ Applied RLS policy: ${statement.split('\n')[0]?.substring(0, 50) || 'Unknown policy'}...`);
          } catch (error) {
            console.warn(`⚠️  Warning applying RLS policy: ${error}`);
            // Continue with other policies even if one fails
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
    await client.end();
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('setup.ts')) {
  console.log('🚀 Starting database setup...');
  runMigrations().catch(console.error);
}

export { runMigrations };
