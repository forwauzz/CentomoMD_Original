# PR0-PR3 File Stubs
*CentomoMD Auth Implementation - Surgical Rollout*

## PR0 — Config & Flags (No Behavior Change)

### `backend/src/config/environment.ts`
```typescript
import { z } from 'zod';

// TODO: Add new environment variables for auth system
const envSchema = z.object({
  // Existing variables...
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  
  // Supabase Configuration
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_JWT_SECRET: z.string().min(1, 'SUPABASE_JWT_SECRET is required'),
  
  // Auth Feature Flags (default to false for safe rollout)
  AUTH_REQUIRED: z.enum(['true', 'false']).default('false'),
  WS_REQUIRE_AUTH: z.enum(['true', 'false']).default('false'),
  
  // WebSocket Configuration
  WS_JWT_SECRET: z.string().min(32, 'WS_JWT_SECRET must be at least 32 characters').optional(),
  PUBLIC_WS_URL: z.string().url().default('ws://localhost:3001'),
  USE_WSS: z.enum(['true', 'false']).default('false'),
  
  // Security Configuration
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  RATE_LIMIT_ENABLED: z.enum(['true', 'false']).default('false'),
  
  // Debug Configuration
  LOG_PAYLOADS: z.enum(['true', 'false']).default('false'),
  DIAG_MODE: z.enum(['true', 'false']).default('false'),
  
  // Legacy variables (to be removed)
  JWT_SECRET: z.string().optional(),
  BCRYPT_ROUNDS: z.string().transform(Number).optional(),
});

// TODO: Validate environment variables
const env = envSchema.parse(process.env);

// TODO: Export typed environment configuration
export const config = {
  // Server configuration
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  
  // Supabase configuration
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: env.SUPABASE_JWT_SECRET,
  },
  
  // Feature flags
  auth: {
    required: env.AUTH_REQUIRED === 'true',
    wsRequireAuth: env.WS_REQUIRE_AUTH === 'true',
  },
  
  // WebSocket configuration
  ws: {
    jwtSecret: env.WS_JWT_SECRET,
    publicUrl: env.PUBLIC_WS_URL,
    useWss: env.USE_WSS === 'true',
  },
  
  // Security configuration
  security: {
    corsOrigins: env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
    rateLimitEnabled: env.RATE_LIMIT_ENABLED === 'true',
  },
  
  // Debug configuration
  debug: {
    logPayloads: env.LOG_PAYLOADS === 'true',
    diagMode: env.DIAG_MODE === 'true',
  },
} as const;

export type Config = typeof config;
```

### `backend/src/routes/config.ts`
```typescript
import { Request, Response } from 'express';
import { config } from '../config/environment.js';

// TODO: GET /api/config endpoint to expose flags to frontend
export const getConfig = (req: Request, res: Response) => {
  // TODO: Return only the flags that frontend needs
  // TODO: Don't expose sensitive configuration
  res.json({
    authRequired: config.auth.required,
    wsRequireAuth: config.auth.wsRequireAuth,
    publicWsUrl: config.ws.publicUrl,
    useWss: config.ws.useWss,
  });
};
```

### `env.example` (additions)
```bash
# =============================================================================
# AUTH CONFIGURATION
# =============================================================================
# Feature flags (default to false for safe rollout)
AUTH_REQUIRED=false
WS_REQUIRE_AUTH=false

# WebSocket JWT secret (required when WS_REQUIRE_AUTH=true)
WS_JWT_SECRET=your_ws_jwt_secret_here_make_it_long_and_random_32_chars_min

# WebSocket configuration
PUBLIC_WS_URL=ws://localhost:3001
USE_WSS=false

# Security configuration
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
RATE_LIMIT_ENABLED=false

# Debug configuration
LOG_PAYLOADS=false
DIAG_MODE=false
```

### Manual Test Checklist (PR0)
- [ ] `GET /api/config` returns expected JSON with flags set to false
- [ ] App runs as-is with no behavior changes
- [ ] Environment validation works with missing required vars
- [ ] New env vars are documented in env.example

---

## PR1 — Security Middleware (Opt-in)

### `backend/src/server/security.ts`
```typescript
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from '../config/environment.js';

// TODO: Configure helmet middleware with security headers
const helmetMiddleware = helmet({
  // TODO: Configure content security policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  // TODO: Enable other security headers
  hsts: true,
  noSniff: true,
  xssFilter: true,
});

// TODO: Configure CORS with allowlist
const corsMiddleware = cors({
  origin: config.security.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

// TODO: Configure rate limiting (disabled by default)
const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// TODO: Export security middleware stack
export const securityMiddleware = [
  helmetMiddleware,
  corsMiddleware,
  // TODO: Only apply rate limiting when enabled
  ...(config.security.rateLimitEnabled ? [rateLimitMiddleware] : []),
];
```

### Update `backend/src/index.ts`
```typescript
import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import { securityMiddleware } from './server/security.js';
import { getConfig } from './routes/config.js';

const app = express();
const server = http.createServer(app);

// TODO: Apply security middleware
app.use(securityMiddleware);

// TODO: Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// TODO: Add config endpoint
app.get('/api/config', getConfig);

// TODO: Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ... existing routes ...
```

### Manual Test Checklist (PR1)
- [ ] `curl -I http://localhost:3001/health` shows Helmet headers
- [ ] CORS preflight works from http://localhost:5173
- [ ] Rate limiting is disabled by default (RATE_LIMIT_ENABLED=false)
- [ ] App functionality unchanged with security middleware applied

---

## PR2 — Frontend Auth Client (Not Used Yet)

### `frontend/src/lib/authClient.ts`
```typescript
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

// TODO: Define auth types
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  clinic_id?: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

// TODO: Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// TODO: Auth hook for session management
export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // TODO: Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ? mapSupabaseUser(session.user) : null,
          loading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false,
        }));
      }
    };

    getInitialSession();

    // TODO: Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ? mapSupabaseUser(session.user) : null,
          loading: false,
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // TODO: Auth methods
  const signInWithMagicLink = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign in failed',
        loading: false,
      }));
    }
  };

  const signInWithGoogle = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Google sign in failed',
        loading: false,
      }));
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign out failed',
        loading: false,
      }));
    }
  };

  return {
    ...state,
    signInWithMagicLink,
    signInWithGoogle,
    signOut,
  };
};

// TODO: Helper function to map Supabase user to our format
const mapSupabaseUser = (user: User): AuthUser => ({
  id: user.id,
  email: user.email || '',
  name: user.user_metadata?.name,
  role: user.user_metadata?.role,
  clinic_id: user.user_metadata?.clinic_id,
});
```

### `frontend/src/lib/api.ts`
```typescript
import { supabase } from './authClient.js';

// TODO: API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// TODO: API error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// TODO: Config cache
let configCache: { authRequired: boolean; wsRequireAuth: boolean } | null = null;

// TODO: Get config from server
const getConfig = async () => {
  if (configCache) return configCache;
  
  try {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error('Failed to fetch config');
    
    configCache = await response.json();
    return configCache;
  } catch (error) {
    console.warn('Failed to fetch config, using defaults:', error);
    return { authRequired: false, wsRequireAuth: false };
  }
};

// TODO: API fetch function with auth
export const apiFetch = async <T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> => {
  const config = await getConfig();
  
  // TODO: Get access token if available
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  
  // TODO: Prepare headers
  const headers = new Headers(init.headers);
  
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  
  // TODO: Make request
  const response = await fetch(path, {
    ...init,
    headers,
  });
  
  // TODO: Handle 401 responses
  if (response.status === 401 && config.authRequired) {
    // TODO: Redirect to login if auth is required
    window.location.href = '/login';
    throw new ApiError('Authentication required', 401);
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `HTTP ${response.status}`,
      response.status,
      errorData.code
    );
  }
  
  return response.json();
};
```

### `frontend/src/components/AuthWidget.tsx`
```typescript
import React, { useState } from 'react';
import { useAuth } from '@/lib/authClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, LogOut, Loader2 } from 'lucide-react';

export const AuthWidget: React.FC = () => {
  const { user, session, loading, error, signInWithMagicLink, signInWithGoogle, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TODO: Handle magic link sign in
  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    try {
      await signInWithMagicLink(email);
      // TODO: Show success message
    } catch (error) {
      // Error is handled by useAuth hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // TODO: Handle Google sign in
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      // Error is handled by useAuth hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // TODO: Handle sign out
  const handleSignOut = async () => {
    setIsSubmitting(true);
    try {
      await signOut();
    } catch (error) {
      // Error is handled by useAuth hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // TODO: Show loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  // TODO: Show authenticated state
  if (user && session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user.name || user.email}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Email: {user.email}</p>
            {user.role && <p>Role: {user.role}</p>}
          </div>
          <Button onClick={handleSignOut} disabled={isSubmitting} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Signing out...' : 'Sign Out'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // TODO: Show sign in form
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}
        
        <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <Button type="submit" disabled={isSubmitting} className="w-full">
            <Mail className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send Magic Link'}
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>
        
        <Button onClick={handleGoogleSignIn} disabled={isSubmitting} variant="outline" className="w-full">
          {isSubmitting ? 'Signing in...' : 'Sign in with Google'}
        </Button>
      </CardContent>
    </Card>
  );
};
```

### `frontend/src/components/ProtectedRoute.tsx`
```typescript
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authClient';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// TODO: Config type
interface Config {
  authRequired: boolean;
  wsRequireAuth: boolean;
  publicWsUrl: string;
  useWss: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [config, setConfig] = useState<Config | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const location = useLocation();

  // TODO: Fetch config from server
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const configData = await response.json();
          setConfig(configData);
        } else {
          console.warn('Failed to fetch config, using defaults');
          setConfig({ authRequired: false, wsRequireAuth: false, publicWsUrl: 'ws://localhost:3001', useWss: false });
        }
      } catch (error) {
        console.warn('Failed to fetch config, using defaults:', error);
        setConfig({ authRequired: false, wsRequireAuth: false, publicWsUrl: 'ws://localhost:3001', useWss: false });
      } finally {
        setConfigLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // TODO: Show loading state
  if (loading || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // TODO: Check if auth is required
  if (config?.authRequired && !user) {
    // TODO: Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // TODO: Render children if authenticated or auth not required
  return <>{children}</>;
};
```

### `frontend/src/pages/LoginPage.tsx`
```typescript
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authClient';
import { AuthWidget } from '@/components/AuthWidget';

export const LoginPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // TODO: Get return URL from location state
  const from = location.state?.from?.pathname || '/dashboard';

  // TODO: Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">CentomoMD</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        
        <AuthWidget />
      </div>
    </div>
  );
};
```

### Update `frontend/src/App.tsx`
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { NewCasePage } from '@/pages/NewCasePage';
import { DictationPage } from '@/pages/DictationPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { TemplateManagement } from '@/pages/TemplateManagement';
import { LoginPage } from '@/pages/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* TODO: Add login route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* TODO: Default route redirects to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* TODO: App layout with existing routes (not protected yet) */}
        <Route path="/" element={<AppLayout>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/case/new" element={<NewCasePage />} />
          <Route path="/templates" element={<TemplateManagement />} />
          <Route path="/dictation" element={<DictationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### Manual Test Checklist (PR2)
- [ ] Login page renders at `/login`
- [ ] Magic link sign in works (check email)
- [ ] Google OAuth sign in works (if configured)
- [ ] Session persists across page reloads
- [ ] Sign out clears session
- [ ] Existing screens still reachable (no guards yet)
- [ ] `apiFetch` injects Bearer token when session exists
- [ ] 401 responses trigger redirect only when auth is required

---

## PR3 — WS Token Exchange Flow (Flagged OFF)

### `backend/src/auth.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { config } from './config/environment.js';

// TODO: JWT payload types
export interface JWTPayload {
  sub: string;
  email: string;
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  user_metadata?: {
    name?: string;
    role?: string;
    clinic_id?: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  clinic_id?: string;
}

// TODO: Supabase client for verification
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

// TODO: JWKS verification function
export const verifySupabaseToken = async (token: string): Promise<AuthUser> => {
  try {
    // TODO: Verify JWT with Supabase JWKS
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid token');
    }

    // TODO: Verify issuer matches Supabase project
    const decoded = jwt.decode(token) as JWTPayload;
    const expectedIssuer = `https://${config.supabase.url.replace('https://', '').replace('http://', '')}/`;
    
    if (decoded.iss !== expectedIssuer) {
      throw new Error('Invalid issuer');
    }

    // TODO: Map user data
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name,
      role: user.user_metadata?.role,
      clinic_id: user.user_metadata?.clinic_id,
    };
  } catch (error) {
    throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// TODO: Auth middleware
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // TODO: Check if auth is required
    if (!config.auth.required) {
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    
    // TODO: Verify token
    const user = await verifySupabaseToken(token);
    
    // TODO: Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};
```

### `backend/src/routes/wsToken.ts`
```typescript
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { verifySupabaseToken } from '../auth.js';
import { config } from '../config/environment.js';

// TODO: WS token payload type
interface WSTokenPayload {
  user_id: string;
  clinic_id?: string;
  role?: string;
  aud: 'ws';
  exp: number;
  iat: number;
}

// TODO: POST /api/ws-token endpoint
export const createWSToken = async (req: Request, res: Response) => {
  try {
    // TODO: Verify Bearer access token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
        code: 'MISSING_TOKEN'
      });
    }

    const accessToken = authHeader.substring(7);
    const user = await verifySupabaseToken(accessToken);

    // TODO: Check if WS JWT secret is configured
    if (!config.ws.jwtSecret) {
      return res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'WebSocket authentication not configured',
        code: 'WS_NOT_CONFIGURED'
      });
    }

    // TODO: Generate WS token with 60s TTL
    const wsTokenPayload: WSTokenPayload = {
      user_id: user.id,
      clinic_id: user.clinic_id,
      role: user.role,
      aud: 'ws',
      exp: Math.floor(Date.now() / 1000) + 60, // 60 seconds
      iat: Math.floor(Date.now() / 1000),
    };

    const wsToken = jwt.sign(wsTokenPayload, config.ws.jwtSecret);

    // TODO: Return WS token
    res.json({
      ws_token: wsToken,
      expires_in: 60,
    });

  } catch (error) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid access token',
      code: 'INVALID_TOKEN'
    });
  }
};
```

### `backend/src/ws/handshake.ts`
```typescript
import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';

// TODO: WS token payload type
interface WSTokenPayload {
  user_id: string;
  clinic_id?: string;
  role?: string;
  aud: 'ws';
  exp: number;
  iat: number;
}

// TODO: WS user context type
export interface WSUserContext {
  user_id: string;
  clinic_id?: string;
  role?: string;
}

// TODO: Verify WS token
export const verifyWSToken = (token: string): WSUserContext => {
  try {
    if (!config.ws.jwtSecret) {
      throw new Error('WS JWT secret not configured');
    }

    // TODO: Verify JWT
    const decoded = jwt.verify(token, config.ws.jwtSecret) as WSTokenPayload;

    // TODO: Check audience
    if (decoded.aud !== 'ws') {
      throw new Error('Invalid audience');
    }

    // TODO: Check expiration
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return {
      user_id: decoded.user_id,
      clinic_id: decoded.clinic_id,
      role: decoded.role,
    };
  } catch (error) {
    throw new Error(`WS token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// TODO: WS handshake function
export const handleWSHandshake = (
  ws: WebSocket,
  req: any,
  onSuccess: (userContext: WSUserContext) => void
) => {
  try {
    // TODO: Check if WS auth is required
    if (!config.auth.wsRequireAuth) {
      // TODO: Allow connection without auth
      onSuccess({
        user_id: 'anonymous',
        clinic_id: undefined,
        role: 'anonymous',
      });
      return;
    }

    // TODO: Extract ws_token from query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    const wsToken = url.searchParams.get('ws_token');

    if (!wsToken) {
      ws.close(4401, 'Authentication required');
      return;
    }

    // TODO: Verify WS token
    const userContext = verifyWSToken(wsToken);

    // TODO: Check clinic access (if needed)
    // TODO: This could be expanded to check clinic membership

    // TODO: Success - attach user context
    onSuccess(userContext);

  } catch (error) {
    // TODO: Handle verification errors
    if (error instanceof Error && error.message.includes('expired')) {
      ws.close(4401, 'Token expired');
    } else if (error instanceof Error && error.message.includes('audience')) {
      ws.close(4429, 'Invalid token audience');
    } else {
      ws.close(4401, 'Authentication failed');
    }
  }
};
```

### Update `backend/src/index.ts`
```typescript
import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import { securityMiddleware } from './server/security.js';
import { getConfig } from './routes/config.js';
import { createWSToken } from './routes/wsToken.js';
import { handleWSHandshake } from './ws/handshake.js';
import { config } from './config/environment.js';

const app = express();
const server = http.createServer(app);

// TODO: Apply security middleware
app.use(securityMiddleware);

// TODO: Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// TODO: Add config endpoint
app.get('/api/config', getConfig);

// TODO: Add WS token endpoint
app.post('/api/ws-token', createWSToken);

// TODO: Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ... existing routes ...

const wss = new WebSocketServer({ server });

// TODO: Store active transcription sessions
const activeSessions = new Map();

wss.on('connection', (ws, req) => {
  let started = false;
  let sessionId = `dev-session-id`;
  let pushAudio: ((u8: Uint8Array) => void) | null = null;
  let endAudio: (() => void) | null = null;
  let userContext: any = null;

  console.log("WebSocket connection established", { sessionId });

  // TODO: Handle WS handshake
  handleWSHandshake(ws, req, (context) => {
    userContext = context;
    console.log("WS authentication successful", { userContext });
  });

  ws.on('message', async (data, isBinary) => {
    // TODO: Existing message handling logic
    // ... (keep existing logic unchanged)
  });

  ws.on('close', () => {
    endAudio?.();
    
    // TODO: Clean up session
    if (activeSessions.has(sessionId)) {
      activeSessions.delete(sessionId);
    }
    
    console.log("WebSocket connection closed", { sessionId, userContext });
  });

  // TODO: Send connection confirmation
  ws.send(JSON.stringify({
    type: 'connection_established',
    payload: {
      sessionId,
      timestamp: new Date(),
      authenticated: !!userContext,
    }
  }));
});

// ... rest of server setup ...
```

### Update `frontend/src/hooks/useWebSocket.ts`
```typescript
import { useState, useRef, useCallback, useEffect } from 'react';
import { WebSocketMessage, UseWebSocketReturn } from '@/types';
import { createWebSocketUrl } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

export const useWebSocket = (onMessage?: (message: any) => void): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 3;
  const reconnectDelay = 2000;

  // TODO: Get config from server
  const [config, setConfig] = useState<{ wsRequireAuth: boolean } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const configData = await response.json();
          setConfig(configData);
        } else {
          setConfig({ wsRequireAuth: false });
        }
      } catch (error) {
        setConfig({ wsRequireAuth: false });
      }
    };

    fetchConfig();
  }, []);

  const connect = useCallback(async () => {
    try {
      let wsUrl: string;

      // TODO: Check if WS auth is required
      if (config?.wsRequireAuth) {
        try {
          // TODO: Get WS token
          const response = await apiFetch<{ ws_token: string }>('/api/ws-token', {
            method: 'POST',
          });
          
          wsUrl = createWebSocketUrl('/transcription', response.ws_token);
        } catch (error) {
          setError('Failed to get WebSocket token');
          return;
        }
      } else {
        // TODO: Use existing flow without auth
        wsUrl = createWebSocketUrl('/transcription');
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // TODO: Existing WebSocket event handlers
      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
        console.log('WebSocket connected');

        // TODO: Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const pingMessage: WebSocketMessage = {
              type: 'ping',
              timestamp: Date.now(),
            };
            ws.send(JSON.stringify(pingMessage));
          }
        }, 30000);
      };

      // TODO: Rest of existing WebSocket logic
      // ... (keep existing logic unchanged)

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setError('Failed to create WebSocket connection');
    }
  }, [config, reconnectAttempts, onMessage]);

  // TODO: Rest of existing hook logic
  // ... (keep existing logic unchanged)

  return {
    isConnected,
    sendMessage,
    error,
    reconnect,
  };
};
```

### Update `frontend/src/lib/utils.ts`
```typescript
// ... existing imports and functions ...

// TODO: Update WebSocket URL creation to accept token
export function createWebSocketUrl(path: string, wsToken?: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname + ':3001';
  
  let url = `${protocol}//${host}${path}`;
  
  // TODO: Add ws_token to query string if provided
  if (wsToken) {
    url += `?ws_token=${encodeURIComponent(wsToken)}`;
  }
  
  return url;
}

// ... rest of existing functions ...
```

### Manual Test Checklist (PR3)
- [ ] With flags OFF, dictation still connects normally
- [ ] `POST /api/ws-token` returns 401 without Bearer token
- [ ] `POST /api/ws-token` returns 200 with valid Bearer token
- [ ] WS connects with valid ws_token when WS_REQUIRE_AUTH=true
- [ ] WS fails with 4401 when WS_REQUIRE_AUTH=true and no token
- [ ] WS fails with 4401 when WS_REQUIRE_AUTH=true and invalid token
- [ ] WS token expires after 60 seconds
- [ ] No tokens or query strings logged in server logs
