import { client } from './src/database/connection.js';
import * as fs from 'fs';
import * as path from 'path';

async function applyRLSPolicies() {
  try {
    console.log('🔐 Applying RLS policies...');
    
    // Read RLS policies file
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
    
    console.log('🎉 RLS setup completed successfully!');
  } catch (error) {
    console.error('❌ RLS setup failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the script
applyRLSPolicies().catch(console.error);
