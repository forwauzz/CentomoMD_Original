import { Router } from 'express';
import { getDb, getSql } from '../database/connection.js';
import { profiles } from '../database/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/api/profile', async (req, res) => {
  const db = getDb();
  const sql = getSql();

  try {
    console.time('smoke');
    await sql`select 1 as ok`;
    console.timeEnd('smoke');

    console.time('exists');
    const exists = await sql`
      select 1 from information_schema.tables
      where table_schema='public' and table_name='profiles' limit 1
    `;
    console.timeEnd('exists');
    if (exists.length === 0) {
      return res.status(500).json({ error: 'profiles table missing — run migrations' });
    }

    console.time('rls');
    const rls = await sql`
      select tablename, rowsecurity
      from pg_tables
      where schemaname='public' and tablename='profiles'
    `;
    console.timeEnd('rls');

    console.time('count');
    const countResult = await sql`select count(*)::int as cnt from "profiles"`;
    const cnt = countResult[0]?.['cnt'] || 0;
    console.timeEnd('count');

    // Use a static test id in Phase 5 if auth is disabled
    const testUserId = (req.headers['x-test-user-id'] as string) || undefined;

    console.time('drizzle');
    const rows = await db
      .select()
      .from(profiles)
      .where(testUserId ? eq(profiles.user_id, testUserId) : undefined)
      .limit(1);
    console.timeEnd('drizzle');

    return res.json({
      ok: true,
      rls: rls[0],
      count: cnt,
      sample: rows,
    });
  } catch (err: any) {
    console.error('[GET /api/profile] ERROR', {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      detail: err?.detail,
      hint: err?.hint,
      routine: err?.routine,
      schema: err?.schema,
      table: err?.table,
      column: err?.column,
      stack: err?.stack,
    });
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
