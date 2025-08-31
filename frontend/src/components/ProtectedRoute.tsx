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
