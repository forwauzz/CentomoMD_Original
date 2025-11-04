/**
 * Setup Supabase Storage bucket for template artifacts
 * Creates bucket and policies for Phase 1 implementation
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env['SUPABASE_URL'];
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function setupStorageBucket() {
  console.log('📦 Setting up Supabase Storage bucket for template artifacts\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Step 1: Check if bucket exists
    console.log('1️⃣ Checking if bucket exists...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError);
      throw listError;
    }

    const bucketExists = buckets?.some(b => b.name === 'template-artifacts');
    
    if (bucketExists) {
      console.log('✅ Bucket "template-artifacts" already exists\n');
    } else {
      // Step 2: Create bucket
      console.log('2️⃣ Creating bucket "template-artifacts"...');
      const { data: bucket, error: createError } = await supabase.storage.createBucket('template-artifacts', {
        public: false, // Private bucket
        fileSizeLimit: 52428800, // 50MB (artifacts are small text files)
        allowedMimeTypes: [
          'text/markdown',
          'application/json',
          'application/xml',
          'application/x-ndjson'
        ]
      });

      if (createError) {
        console.error('❌ Failed to create bucket:', createError);
        throw createError;
      }

      console.log('✅ Bucket created successfully\n');
    }

    // Step 3: Verify bucket configuration
    console.log('3️⃣ Verifying bucket configuration...');
    const { data: bucketInfo, error: getError } = await supabase.storage.getBucket('template-artifacts');
    
    if (getError) {
      console.error('❌ Failed to get bucket info:', getError);
      throw getError;
    }

    console.log('✅ Bucket configuration:');
    console.log(`   Name: ${bucketInfo?.name}`);
    console.log(`   Public: ${bucketInfo?.public}`);
    console.log(`   File size limit: ${bucketInfo?.fileSizeLimit} bytes`);
    console.log(`   Allowed MIME types: ${bucketInfo?.allowedMimeTypes?.join(', ') || 'All'}\n`);

    console.log('✅ Storage bucket setup complete!\n');
    console.log('📝 Next steps:');
    console.log('   1. Run SQL policies from: backend/sql/create_storage_bucket.sql');
    console.log('   2. Or create policies via Supabase Dashboard');
    console.log('   3. Proceed to Step 3: Extend PromptBundleResolver\n');

  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

setupStorageBucket();

