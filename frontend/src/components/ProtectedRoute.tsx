import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authClient';
import { Loader2, AlertCircle } from 'lucide-react';

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

  // Fetch config from server with retry logic
  useEffect(() => {
    const fetchConfig = async (retryCount = 0) => {
      try {
        setConfigError(null);
        const response = await fetch('/api/config');
        if (response.ok) {
          const configData = await response.json();
          setConfig(configData);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.warn('Failed to fetch config:', error);
        setConfigError(error instanceof Error ? error.message : 'Unknown error');
        
        // Retry logic (max 3 attempts)
        if (retryCount < 3) {
          setTimeout(() => fetchConfig(retryCount + 1), 1000 * (retryCount + 1));
          return;
        }
        
        // Fallback to defaults after retries exhausted
        setConfig({ 
          authRequired: false, 
          wsRequireAuth: false, 
          publicWsUrl: 'ws://localhost:3001', 
          useWss: false 
        });
      } finally {
        setConfigLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Enhanced loading state with timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (configLoading) {
        setConfigError('Config loading timeout - please refresh the page');
        setConfigLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [configLoading]);

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

  // Show config error state
  if (configError && !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-3 p-6 bg-white rounded-lg shadow-md max-w-md">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Configuration Error</h3>
            <p className="text-sm text-gray-500 mb-4">{configError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if auth is required
  if (config?.authRequired && !user) {
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
