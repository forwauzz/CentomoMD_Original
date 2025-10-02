import type { IncomingMessage } from 'http';
import { ENV } from '../config/env.js';
import * as jose from 'jose';
import { parse } from 'url';

export async function wsAuthCheck(req: IncomingMessage): Promise<boolean> {
  if (!ENV.WS_REQUIRE_AUTH) return true;

  const url = parse(req.url || '', true);
  const token = (url.query['token'] as string) || '';

  if (!token) return false;

  try {
    if (ENV.AUTH_VERIFY_STRATEGY === 'jwks' && ENV.JWKS_URL) {
      const JWKS = jose.createRemoteJWKSet(new URL(ENV.JWKS_URL));
      await jose.jwtVerify(token, JWKS);
      return true;
    } else if (ENV.SUPABASE_JWT_SECRET) {
      const key = new TextEncoder().encode(ENV.SUPABASE_JWT_SECRET);
      await jose.jwtVerify(token, key, { algorithms: ['HS256'] });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
