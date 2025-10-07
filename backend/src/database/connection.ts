// backend/src/database/connection.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { Sql } from 'postgres';
import { ENV } from '../config/env.js';

function ensureSslRequire(url: string) {
  if (!url) throw new Error('DATABASE_URL is missing');
  if (url.includes('?')) return url.includes('sslmode=') ? url : `${url}&sslmode=require`;
  return `${url}?sslmode=require`;
}

const RAW_URL = ENV.DATABASE_URL;
const POOLED_URL = ensureSslRequire(RAW_URL);

let _sql: Sql | null = null;
export function getSql(): Sql {
  if (_sql) return _sql;
  _sql = postgres(POOLED_URL, {
    // CRITICAL for Supabase transaction pooling (port 6543)
    prepare: false,

    // Safe dev defaults
    max: 5,
    idle_timeout: 20,     // seconds
    connect_timeout: 10,  // seconds

    // Handy when sending objects with optional fields
    transform: { undefined: null },

    // Flip on temporarily if needed
    // debug: (conn, q, params) => console.log('[pg debug]', q, params),
    onnotice: (n) => console.log('[pg notice]', n),
  });
  return _sql;
}

let _db: ReturnType<typeof drizzle> | null = null;
export function getDb() {
  if (_db) return _db;
  _db = drizzle(getSql(), { logger: true });
  return _db;
}

// Boot-time probe to catch schema/RLS issues early
export async function bootProbe() {
  const sql = getSql();

  try {
    // 1) Driver connectivity
    console.log('[boot] Testing database connectivity...');
    await sql`select 1 as ok`;
    console.log('[boot] ✅ Database connectivity OK');

    // 2) Table exists? (no RLS impact)
    console.log('[boot] Checking if profiles table exists...');
    const exists = await sql`
      select 1 from information_schema.tables
      where table_schema='public' and table_name='profiles' limit 1
    `;
    if (exists.length === 0) {
      throw new Error('profiles table missing — run migrations against DIRECT_DATABASE_URL');
    }
    console.log('[boot] ✅ Profiles table exists');

    // 3) Can we count rows? (RLS will bite here if misconfigured)
    console.log('[boot] Testing row count access...');
    const countResult = await sql`select count(*)::int as cnt from "profiles"`;
    const cnt = countResult[0]?.['cnt'] || 0;
    console.log(`[boot] ✅ Profiles rowcount = ${cnt}`);

    console.log('[boot] 🎉 Database boot probe completed successfully');
  } catch (error) {
    console.error('[boot] ❌ Database boot probe failed:', error);
    throw error;
  }
}
