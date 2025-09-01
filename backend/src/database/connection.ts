import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import { env } from '../config/environment.js';

console.log('DB module loaded from:', import.meta.url || __filename);

// Clean the URL to remove any invisible characters
let url = env.DATABASE_URL.trim().replace(/[\u200B\u200C\u200D\uFEFF]/g, '');

console.log('🔍 DATABASE_URL length:', url.length);
console.log('🔍 DATABASE_URL preview:', url.substring(0, 50) + '...');
console.log('🔍 DATABASE_URL contains newlines:', url.includes('\n'));

let db: any;
let client: any;

try {
  console.log('🔍 Parsing DATABASE_URL...');
  const parsed = new URL(url);
  console.log('🔍 Host:', parsed.hostname, 'Port:', parsed.port, 'Protocol:', parsed.protocol);
  
  // Add SSL mode if not present
  if (!url.includes('sslmode=')) {
    url += '?sslmode=require';
    console.log('🔍 Added sslmode=require to URL');
  }

  const sql = postgres(url, {
    ssl: 'require',
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // REQUIRED for Supavisor transaction mode (6543)
  });

  db = drizzle(sql, { schema });
  client = sql;
  console.log('✅ DB configured (pooled), host:', parsed.hostname);
} catch (e) {
  console.error('❌ Failed to configure DB:', e);
  throw e;
}

export { db, client };

