import { Request, Response } from 'express';
import { config } from '../config/env.js';

// TODO: GET /api/config endpoint to expose flags to frontend
export const getConfig = (_req: Request, res: Response) => {
  // TODO: Return only the flags that frontend needs
  // TODO: Don't expose sensitive configuration
  res.json({
    authRequired: config.auth.required,
    wsRequireAuth: config.auth.wsRequireAuth,
    publicWsUrl: config.ws.publicUrl,
    useWss: config.ws.useWss,
  });
};
