#!/usr/bin/env node

/**
 * Development seed script to create necessary data for case management
 * This ensures foreign key constraints are satisfied
 */

import { getDb, getSql } from '../src/database/connection.ts';

const DEV_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const DEV_CLINIC_ID = '550e8400-e29b-41d4-a716-446655440001';

async function seedDevData() {
  console.log('🌱 Seeding development data...');
  
  const sql = getSql();
  
  try {
    // 1. Create a development user
    console.log('👤 Creating development user...');
    await sql`
      INSERT INTO users (id, email, name, role, created_at, updated_at)
      VALUES (${DEV_USER_ID}, 'dev@centomo.com', 'Development User', 'doctor', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;
    
    // 2. Create a development profile
    console.log('👤 Creating development profile...');
    await sql`
      INSERT INTO profiles (user_id, display_name, locale, consent_pipeda, consent_marketing, created_at, updated_at)
      VALUES (${DEV_USER_ID}, 'Dev User', 'fr-CA', true, false, NOW(), NOW())
      ON CONFLICT (user_id) DO NOTHING
    `;
    
    // 3. Create a development clinic
    console.log('🏥 Creating development clinic...');
    await sql`
      INSERT INTO clinics (id, name, address, phone, email, created_at, updated_at)
      VALUES (${DEV_CLINIC_ID}, 'Centomo Development Clinic', '123 Dev Street, Montreal, QC', '514-555-0123', 'clinic@centomo.com', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;
    
    // 4. Create a membership linking user to clinic
    console.log('🔗 Creating user-clinic membership...');
    await sql`
      INSERT INTO memberships (user_id, clinic_id, role, active, created_at, updated_at)
      VALUES (${DEV_USER_ID}, ${DEV_CLINIC_ID}, 'physician', true, NOW(), NOW())
      ON CONFLICT (user_id, clinic_id) DO NOTHING
    `;
    
    console.log('✅ Development data seeded successfully!');
    console.log(`   - User ID: ${DEV_USER_ID}`);
    console.log(`   - Clinic ID: ${DEV_CLINIC_ID}`);
    
  } catch (error) {
    console.error('❌ Error seeding development data:', error);
    throw error;
  }
}

// Run the seed function
seedDevData()
  .then(() => {
    console.log('🎉 Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  });
