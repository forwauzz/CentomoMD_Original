/**
 * Migration script to add status column to cases table
 * Run with: node backend/migrate-add-status-column.js
 */

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function migrate() {
  try {
    console.log('🔄 Starting migration: Add status column to cases table...\n');

    // Add the status column
    console.log('1️⃣ Adding status column...');
    await sql`
      ALTER TABLE cases
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    `;
    console.log('✅ Status column added\n');

    // Add check constraint
    console.log('2️⃣ Adding check constraint...');
    try {
      await sql`
        ALTER TABLE cases
        ADD CONSTRAINT cases_status_check CHECK (status IN ('draft', 'in_progress', 'completed'))
      `;
      console.log('✅ Check constraint added\n');
    } catch (error) {
      // Constraint might already exist
      if (error && error.code === '42P07') {
        console.log('⚠️  Check constraint already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    // Update existing records
    console.log('3️⃣ Updating existing records...');
    const updateResult = await sql`
      UPDATE cases
      SET status = 'draft'
      WHERE status IS NULL
    `;
    console.log(`✅ Updated ${updateResult.count || 0} existing records\n`);

    // Verify the column
    console.log('4️⃣ Verifying migration...');
    const verification = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cases' AND column_name = 'status'
    `;

    if (verification.length > 0) {
      console.log('✅ Migration verified successfully!');
      console.log('Column details:', verification[0]);
    } else {
      console.error('❌ Migration verification failed - column not found');
      process.exit(1);
    }

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error?.message || error);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();

