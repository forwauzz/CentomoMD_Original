import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authClient';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // TODO: Add optional props for role-based access
  requiredRoles?: string[];
  requiredClinicAccess?: boolean;
}

// TODO: Config type - should match backend /api/config response
interface Config {
  authRequired: boolean;
  wsRequireAuth: boolean;
  publicWsUrl: string;
  useWss: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles,
  requiredClinicAccess 
}) => {
  const { user, loading } = useAuth();
  const [config, setConfig] = useState<Config | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const location = useLocation();

  // TODO: Fetch config from server with error handling
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const configData = await response.json();
          setConfig(configData);
        } else {
          console.warn('Failed to fetch config, using defaults');
          setConfig({ 
            authRequired: false, 
            wsRequireAuth: false, 
            publicWsUrl: 'ws://localhost:3001', 
            useWss: false 
          });
        }
      } catch (error) {
        console.warn('Failed to fetch config, using defaults:', error);
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

  // TODO: Show loading state with better UX
  if (loading || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // TODO: Check if auth is required by server config
  if (config?.authRequired && !user) {
    // TODO: Redirect to login with return URL for better UX
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // TODO: Check role-based access if user is authenticated
  if (user && requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user.role)) {
      // TODO: Redirect to unauthorized page or show error
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // TODO: Check clinic access if required
  if (user && requiredClinicAccess && !user.clinic_id) {
    // TODO: Redirect to clinic selection or show error
    return <Navigate to="/select-clinic" replace />;
  }

  // TODO: Render children if all checks pass
  return <>{children}</>;
};
