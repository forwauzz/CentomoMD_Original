import { Router } from 'express';
import { getSql } from '../database/connection.js';

const router = Router();

router.get('/api/db/ping', async (_req, res) => {
  try {
    const sql = getSql();
    const okResult = await sql`select 1 as ok`;
    const countResult = await sql`select count(*)::int as c from "profiles"`;
    const ok = okResult[0]?.['ok'] || 0;
    const c = countResult[0]?.['c'] || 0;
    res.json({ ok, profiles: c });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'db ping failed' });
  }
});

export default router;
