#!/usr/bin/env tsx

/**
 * Hardened Admin User Creation Script
 * 
 * This script creates a user in Supabase with proper validation and no secrets in logs.
 * 
 * Usage:
 *   tsx scripts/admin-create-user.ts <email> <password>
 * 
 * Environment Variables Required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 * 
 * Features:
 * - Email normalization (Gmail dots/plus handling)
 * - Input validation
 * - No secrets in logs
 * - Clear error messages
 * - Parameterized inputs
 */

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { validateAndNormalizeEmail } from '../backend/src/utils/email.js';

// Validate environment variables
const envSchema = z.object({
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY must be at least 20 characters'),
});

const env = envSchema.parse(process.env);

// Validate command line arguments
const argsSchema = z.object({
  email: z.string().email('Email must be a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

function validateArgs(): { email: string; password: string } {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error('❌ Usage: tsx scripts/admin-create-user.ts <email> <password>');
    console.error('   Example: tsx scripts/admin-create-user.ts user@example.com MyPassword123!');
    process.exit(1);
  }
  
  try {
    return argsSchema.parse({
      email: args[0],
      password: args[1],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation errors:');
      error.errors.forEach(err => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('❌ Unexpected error:', error);
    }
    process.exit(1);
  }
}

async function createUser() {
  console.log('🏥 Admin User Creation Script');
  console.log('=============================\n');
  
  // Validate inputs
  const { email: rawEmail, password } = validateArgs();
  
  // Normalize email
  const normalizedEmail = validateAndNormalizeEmail(rawEmail);
  
  console.log('📧 Email Details:');
  console.log(`   Raw:      ${rawEmail}`);
  console.log(`   Normalized: ${normalizedEmail}`);
  console.log(`   Password: ${'*'.repeat(password.length)} (${password.length} characters)`);
  console.log(`   Supabase URL: ${env.SUPABASE_URL.replace(/\/[^\/]*$/, '/***')}\n`);
  
  // Create Supabase admin client
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  try {
    console.log('🔄 Creating user...');
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true, // Automatically confirm the user's email
    });
    
    if (error) {
      console.error('❌ Error creating user:', error.message);
      
      // Provide helpful error messages
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        console.log('\n💡 User already exists. This might be due to:');
        console.log('   - Email normalization (dots/plus signs removed)');
        console.log('   - User was created previously');
        console.log('   - Try a different email address');
      } else if (error.message.includes('Database error')) {
        console.log('\n💡 Database error. This might be due to:');
        console.log('   - Supabase project configuration issues');
        console.log('   - Service role key permissions');
        console.log('   - Network connectivity problems');
      }
      
      process.exit(1);
    }
    
    console.log('✅ User created successfully!');
    console.log(`   User ID: ${data.user?.id}`);
    console.log(`   Email: ${data.user?.email}`);
    console.log(`   Created: ${data.user?.created_at}`);
    console.log(`   Email Confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}`);
    
    if (data.user?.user_metadata) {
      console.log(`   Metadata: ${JSON.stringify(data.user.user_metadata, null, 2)}`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
createUser();
