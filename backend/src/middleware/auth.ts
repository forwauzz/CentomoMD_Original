import type { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env.js';
import * as jose from 'jose';

function bearer(req: Request) {
  const h = req.headers.authorization || '';
  const m = /^Bearer\s+(.+)$/.exec(h);
  return m ? m[1] : null;
}

async function verifySupabaseHS256(token: string, secret: string) {
  const key = new TextEncoder().encode(secret);
  const { payload } = await jose.jwtVerify(token, key, { algorithms: ['HS256'] });
  return payload;
}

async function verifyJWKS(token: string, jwksUrl: string) {
  const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
  const { payload } = await jose.jwtVerify(token, JWKS);
  return payload;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!ENV.AUTH_REQUIRED) return next();

  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });

  try {
    let payload: any;
    if (ENV.AUTH_VERIFY_STRATEGY === 'jwks' && ENV.JWKS_URL) {
      payload = await verifyJWKS(token, ENV.JWKS_URL);
    } else if (ENV.SUPABASE_JWT_SECRET) {
      payload = await verifySupabaseHS256(token, ENV.SUPABASE_JWT_SECRET);
    } else {
      return res.status(500).json({ error: 'No verifier configured' });
    }
    (req as any).user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
