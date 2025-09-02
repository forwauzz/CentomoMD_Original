import { Router } from 'express';
import { getDb, getSql } from '../database/connection.js';
import { profiles } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Apply auth middleware to all profile routes
router.use(authMiddleware);

router.get('/api/profile', async (req, res) => {
  const db = getDb();
  const sql = getSql();
  const user = (req as any).user;

  try {
    // Audit logging for secure event tracking
    logger.info('Profile access requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

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

    // Use authenticated user ID instead of test header
    const userId = user?.user_id;

    console.time('drizzle');
    const rows = await db
      .select()
      .from(profiles)
      .where(userId ? eq(profiles.user_id, userId) : undefined)
      .limit(1);
    console.timeEnd('drizzle');

    // Audit logging for successful access
    logger.info('Profile access successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      profilesFound: rows.length
    });

    return res.json({
      ok: true,
      rls: rls[0],
      count: cnt,
      sample: rows,
      user: {
        id: user?.user_id,
        email: user?.email,
        role: user?.role
      }
    });
  } catch (err: any) {
    // Audit logging for errors
    logger.error('Profile access failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: err?.message,
      stack: err?.stack
    });

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
