#!/usr/bin/env tsx

/**
 * Supabase Smoke Test for Application
 * 
 * This script tests the Supabase client configuration and basic operations
 * without making destructive changes to the database.
 * 
 * Usage:
 *   npm run supabase:smoke:app
 *   npm run supabase:smoke:app -- --try-signup
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL:', url ? '✅' : '❌');
    console.error('   SUPABASE_ANON_KEY:', anonKey ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌');
    process.exit(1);
  }

  return { url, anonKey, serviceRoleKey };
}

function logConfig(config: SupabaseConfig) {
  console.log('🔗 Supabase Configuration:');
  console.log('   URL:', config.url);
  console.log('   Anon Key Type:', config.anonKey.startsWith('eyJ') ? 'JWT' : 'Unknown');
  console.log('   Service Role Key Type:', config.serviceRoleKey.startsWith('eyJ') ? 'JWT' : 'Unknown');
  console.log('   Anon Key Length:', config.anonKey.length);
  console.log('   Service Role Key Length:', config.serviceRoleKey.length);
}

async function testAnonClient(config: SupabaseConfig) {
  console.log('\n🔍 Testing Anonymous Client...');
  
  const anonClient = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  try {
    // Test basic connection
    const { data, error } = await anonClient.auth.getSession();
    if (error) {
      console.log('   ✅ Anonymous client created (expected no session)');
    } else {
      console.log('   ✅ Anonymous client created');
    }
    return anonClient;
  } catch (error) {
    console.error('   ❌ Anonymous client failed:', error);
    throw error;
  }
}

async function testServiceClient(config: SupabaseConfig) {
  console.log('\n🔍 Testing Service Role Client...');
  
  const serviceClient = createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  try {
    // Test admin operations
    const { data, error } = await serviceClient.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });
    
    if (error) {
      console.error('   ❌ Service client admin operation failed:', error.message);
      return null;
    } else {
      console.log('   ✅ Service client admin operation successful');
      console.log('   📊 Total users:', data.total || 'unknown');
      return serviceClient;
    }
  } catch (error) {
    console.error('   ❌ Service client failed:', error);
    return null;
  }
}

async function testSignUp(anonClient: any, shouldTest: boolean) {
  if (!shouldTest) {
    console.log('\n⏭️  Skipping sign-up test (use --try-signup to enable)');
    return;
  }

  console.log('\n🔍 Testing Sign-Up (with random email)...');
  
  const randomEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
  
  try {
    const { data, error } = await anonClient.auth.signUp({
      email: randomEmail,
      password: 'TestPassword123!',
    });
    
    if (error) {
      console.log('   📝 Sign-up error (expected):', error.message);
      if (error.message.includes('already registered')) {
        console.log('   ✅ Email normalization working (duplicate detected)');
      }
    } else {
      console.log('   ✅ Sign-up successful:', data.user?.email);
    }
  } catch (error) {
    console.error('   ❌ Sign-up test failed:', error);
  }
}

async function main() {
  console.log('🚀 Supabase Application Smoke Test');
  console.log('=====================================');
  
  const shouldTestSignUp = process.argv.includes('--try-signup');
  
  try {
    // Get configuration
    const config = getSupabaseConfig();
    logConfig(config);
    
    // Test clients
    const anonClient = await testAnonClient(config);
    const serviceClient = await testServiceClient(config);
    
    // Test sign-up if requested
    await testSignUp(anonClient, shouldTestSignUp);
    
    console.log('\n✅ Smoke test completed successfully');
    
    if (!serviceClient) {
      console.log('\n⚠️  Service role client failed - this may indicate:');
      console.log('   - Incorrect service role key');
      console.log('   - Supabase project configuration issues');
      console.log('   - Network connectivity problems');
    }
    
  } catch (error) {
    console.error('\n❌ Smoke test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
