import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authClient';
import { Loader2, AlertCircle } from 'lucide-react';
import { API_CONFIG } from '@/lib/constants';
import { api } from '@/lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredClinicAccess?: boolean;
}

// Config type matching backend response
interface Config {
  authRequired: boolean;
  wsRequireAuth: boolean;
  publicWsUrl: string;
  useWss: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [], 
  requiredClinicAccess = false 
}) => {
  const { user, loading } = useAuth();
  const [config, setConfig] = useState<Config | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const location = useLocation();

  // Fetch config from server with retry logic and timeout
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout per request

    const fetchConfig = async (retryCount = 0) => {
      try {
        setConfigError(null);
        const response = await api('/api/config', {
          signal: controller.signal
        });
        const configData = await response.json();
        if (isMounted) {
          setConfig(configData);
          setConfigLoading(false);
        }
      } catch (error) {
        if (!isMounted) return;
        
        // If aborted, don't retry - just use fallback
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Config fetch timeout, using defaults');
          setConfig({ 
            authRequired: false, 
            wsRequireAuth: false, 
            publicWsUrl: API_CONFIG.WS_URL, 
            useWss: false 
          });
          setConfigLoading(false);
          return;
        }
        
        console.warn('Failed to fetch config:', error);
        setConfigError(error instanceof Error ? error.message : 'Unknown error');
        
        // Retry logic (max 2 attempts with shorter delays)
        if (retryCount < 2) {
          setTimeout(() => fetchConfig(retryCount + 1), 1000 * (retryCount + 1));
          return;
        }
        
        // Fallback to defaults after retries exhausted
        if (isMounted) {
          setConfig({ 
            authRequired: false, 
            wsRequireAuth: false, 
            publicWsUrl: API_CONFIG.WS_URL, 
            useWss: false 
          });
          setConfigLoading(false);
        }
      }
    };

    fetchConfig();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  // Enhanced loading state with timeout - fallback if config never loads
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (configLoading && !config) {
        console.warn('Config loading timeout, using defaults');
        setConfig({ 
          authRequired: false, 
          wsRequireAuth: false, 
          publicWsUrl: API_CONFIG.WS_URL, 
          useWss: false 
        });
        setConfigLoading(false);
      }
    }, 8000); // 8 second overall timeout

    return () => clearTimeout(timeout);
  }, [configLoading, config]);

  // Show loading state
  if (loading || configLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-3 p-6 bg-white rounded-lg shadow-md">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Loading...</h3>
            <p className="text-sm text-gray-500">Checking authentication and permissions</p>
          </div>
        </div>
      </div>
    );
  }

  // Show config error state only if we don't have a fallback config
  // If we have config (even from fallback), proceed normally
  if (configError && !config && !configLoading) {
    // Still try to use defaults rather than blocking
    console.warn('Config error but proceeding with defaults:', configError);
    // Don't block - use defaults and continue
  }

  // Ensure we have a config (use defaults if not available)
  const effectiveConfig = config || {
    authRequired: false,
    wsRequireAuth: false,
    publicWsUrl: API_CONFIG.WS_URL,
    useWss: false
  };

  // Check if auth is required
  if (effectiveConfig.authRequired && !user) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRoles.length > 0 && user) {
    const userRole = user.role || 'user';
    const hasRequiredRole = requiredRoles.includes(userRole) || requiredRoles.includes('*');
    
    if (!hasRequiredRole) {
      // Redirect to unauthorized page
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check clinic access
  if (requiredClinicAccess && user && !user.clinic_id) {
    // Redirect to clinic selection page
    return <Navigate to="/select-clinic" replace />;
  }

  // Render children if all checks pass
  return <>{children}</>;
};
