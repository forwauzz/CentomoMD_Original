import { Request, Response } from 'express';
import { config } from '../config/env.js';

// GET /api/config endpoint to expose flags to frontend
export const getConfig = (_req: Request, res: Response) => {
  // Return only the flags that frontend needs
  // Don't expose sensitive configuration
  res.json({
    authRequired: config.auth.required,
    wsRequireAuth: config.auth.wsRequireAuth,
    publicWsUrl: config.ws.publicUrl,
    useWss: config.ws.useWss,
    universalCleanupEnabled: config.features.universalCleanupEnabled,
    universalCleanupShadow: config.features.universalCleanupShadow,
  });
};
