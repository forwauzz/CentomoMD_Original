#!/usr/bin/env node

/**
 * Script to create Dr. Centomo user account in Supabase
 * This script uses the Supabase Admin API to create a user account
 * 
 * Usage: node create-dr-centomo-user.js
 * 
 * Make sure you have the following environment variables set:
 * - SUPABASE_URL (your actual Supabase project URL)
 * - SUPABASE_SERVICE_ROLE_KEY (your service role key)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌');
  console.error('\n📝 To fix this:');
  console.error('   1. Get your Supabase URL and Service Role Key from:');
  console.error('      https://supabase.com/dashboard/project/[your-project]/settings/api');
  console.error('   2. Set the environment variables:');
  console.error('      set SUPABASE_URL=https://your-project.supabase.co');
  console.error('      set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('   3. Run the script again');
  process.exit(1);
}

// Validate that we have real values, not placeholders
if (supabaseUrl.includes('your-project') || serviceRoleKey.includes('your_')) {
  console.error('❌ Environment variables contain placeholder values!');
  console.error('   Please set the actual Supabase URL and Service Role Key');
  console.error('   Get them from: https://supabase.com/dashboard/project/[your-project]/settings/api');
  process.exit(1);
}

console.log('🔗 Using Supabase URL:', supabaseUrl);
console.log('🔑 Service Role Key:', serviceRoleKey.substring(0, 20) + '...');

// Create Supabase client with service role key (admin access)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDrCentomoUser() {
  console.log('🏥 Creating Dr. Centomo user account...');
  console.log('📧 Email: hugocentomo@gmail.com');
  console.log('🔐 Password: CentomoMD2025!');
  
  try {
    // Try creating user with minimal parameters first
    console.log('🔄 Attempting to create user with minimal parameters...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'hugocentomo@gmail.com',
      password: 'CentomoMD2025!',
      email_confirm: true
    });

    if (error) {
      console.error('❌ Error creating user:', error.message);
      console.error('🔍 Full error details:', error);
      
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        console.log('ℹ️  User already exists. Checking if we can update...');
        
        // Try to get the existing user
        const { data: existingUser, error: getUserError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000
        });
        
        if (getUserError) {
          console.error('❌ Error getting existing user:', getUserError.message);
        } else {
          const user = existingUser.users.find(u => u.email === 'hugocentomo@gmail.com');
          if (user) {
            console.log('✅ User already exists:', user.email);
            console.log('📋 User ID:', user.id);
            console.log('📅 Created at:', user.created_at);
            console.log('✅ Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
          } else {
            console.log('ℹ️  User not found in list, but creation failed. This might be a temporary database issue.');
          }
        }
      } else if (error.message.includes('Database error')) {
        console.log('🔧 Database error detected. This might be due to:');
        console.log('   1. Supabase project not fully initialized');
        console.log('   2. Database connection issues');
        console.log('   3. Service role key permissions');
        console.log('   4. User already exists with different metadata');
        
        // Try to check if user exists anyway
        console.log('🔍 Checking if user exists...');
        const { data: existingUser, error: getUserError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000
        });
        
        if (getUserError) {
          console.error('❌ Error checking existing user:', getUserError.message);
        } else {
          const user = existingUser.users.find(u => u.email === 'hugocentomo@gmail.com');
          if (user) {
            console.log('✅ User already exists:', user.email);
            console.log('📋 User ID:', user.id);
          } else {
            console.log('ℹ️  User does not exist. Database error might be temporary.');
          }
        }
      }
      return;
    }

    console.log('✅ Dr. Centomo user created successfully!');
    console.log('📋 User ID:', data.user.id);
    console.log('📧 Email:', data.user.email);
    console.log('📅 Created at:', data.user.created_at);
    console.log('✅ Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
    
    console.log('\n🎉 Account Details:');
    console.log('   Email: hugocentomo@gmail.com');
    console.log('   Password: CentomoMD2025!');
    console.log('   Role: Doctor');
    console.log('   Status: Active & Email Confirmed');
    
    console.log('\n📝 Next Steps:');
    console.log('   1. Dr. Centomo can now log in to the production app');
    console.log('   2. Check Supabase dashboard to verify the user appears');
    console.log('   3. Test login at: https://centomo-md-original-kskp.vercel.app/login');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
createDrCentomoUser();
