import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';

// TODO: WS token exchange endpoint
export const getWsToken = async (req: Request, res: Response) => {
  try {
    // TODO: Check if WS auth is enabled
    if (!env.WS_REQUIRE_AUTH) {
      return res.status(400).json({
        error: 'WebSocket authentication is not enabled',
        code: 'WS_AUTH_DISABLED'
      });
    }

    // TODO: Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header',
        code: 'MISSING_AUTH_HEADER'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // TODO: Verify Supabase JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // TODO: Extract user info from token
    const userId = decoded.sub;
    const userEmail = decoded.email;

    if (!userId || !userEmail) {
      return res.status(401).json({
        error: 'Token missing required user information',
        code: 'INVALID_TOKEN_PAYLOAD'
      });
    }

    // TODO: Generate short-lived WS token (60 seconds)
    const wsToken = jwt.sign(
      {
        userId,
        userEmail,
        type: 'ws_token',
        iat: Math.floor(Date.now() / 1000),
      },
      env.WS_JWT_SECRET || env.JWT_SECRET,
      { expiresIn: '60s' }
    );

    // TODO: Return WS token
    res.json({
      wsToken,
      expiresIn: 60,
      wsUrl: config.ws.publicUrl,
      useWss: config.ws.useWss,
    });

  } catch (error) {
    console.error('WS token exchange error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};
