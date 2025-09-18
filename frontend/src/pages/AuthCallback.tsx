import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, getIntendedPath, clearIntendedPath, decodeState } from '@/lib/authClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  // Function to create user profile
  const createUserProfile = async (accessToken: string) => {
    try {
      console.log('🔧 Creating user profile...');
      
      try {
        const result = await apiFetch('/api/profile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        console.log('✅ Profile created successfully:', result);
        return true;
      } catch (error: any) {
        if (error.message.includes('409')) {
          // Profile already exists, that's fine
          console.log('ℹ️ Profile already exists');
          return true;
        } else {
          console.warn('⚠️ Profile creation failed:', error);
          // Don't fail the auth process if profile creation fails
          return false;
        }
      }
    } catch (error) {
      console.warn('⚠️ Profile creation error:', error);
      // Don't fail the auth process if profile creation fails
      return false;
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔍 Auth callback triggered, processing...');
        
        // Get the hash fragment from the URL (Supabase puts tokens here)
        const hash = location.hash;
        console.log('🔍 Hash fragment:', hash ? 'present' : 'missing');
        
        // Extract intended path in priority order
        const getIntendedDestination = () => {
          // 1. Check URL state parameter (from OAuth)
          const urlParams = new URLSearchParams(location.search);
          const stateParam = urlParams.get('state');
          if (stateParam) {
            try {
              const stateData = decodeState(stateParam);
              if (stateData.intended) {
                console.log('🔍 Found intended path in OAuth state:', stateData.intended);
                return stateData.intended;
              }
            } catch (error) {
              console.warn('⚠️ Failed to decode OAuth state:', error);
            }
          }
          
          // 2. Check localStorage fallback
          const storedPath = getIntendedPath();
          if (storedPath) {
            console.log('🔍 Found intended path in localStorage:', storedPath);
            return storedPath;
          }
          
          // 3. Check ?redirect param
          const redirectParam = urlParams.get('redirect');
          if (redirectParam) {
            console.log('🔍 Found intended path in redirect param:', redirectParam);
            return redirectParam;
          }
          
          // 4. Default to root
          console.log('🔍 No intended path found, defaulting to /');
          return '/';
        };
        
        if (hash) {
          // Parse the hash to extract access_token and refresh_token
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const error = params.get('error');
          const errorDescription = params.get('error_description');
          
          console.log('🔍 Auth params:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            error,
            errorDescription
          });
          
          if (error) {
            throw new Error(errorDescription || error);
          }
          
          if (accessToken && refreshToken) {
            // Set the session manually
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              throw sessionError;
            }
            
            console.log('✅ Session established successfully');
            
            // Try to create profile automatically
            if (accessToken) {
              await createUserProfile(accessToken);
            }
            
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            
            // Get intended destination and redirect
            const intendedDestination = getIntendedDestination();
            clearIntendedPath();
            
            setTimeout(() => {
              navigate(intendedDestination, { replace: true });
            }, 1500);
            
          } else {
            // Try to get session from Supabase (for magic links)
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              throw sessionError;
            }
            
            if (session) {
              console.log('✅ Session retrieved successfully');
              
              // Try to create profile automatically
              if (session.access_token) {
                await createUserProfile(session.access_token);
              }
              
              setStatus('success');
              setMessage('Authentication successful! Redirecting...');
              
              // Get intended destination and redirect
              const intendedDestination = getIntendedDestination();
              clearIntendedPath();
              
              setTimeout(() => {
                navigate(intendedDestination, { replace: true });
              }, 1500);
            } else {
              throw new Error('No session found after authentication');
            }
          }
          
        } else {
          // No hash, try to get session (for magic links that don't use hash)
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }
          
          if (session) {
            console.log('✅ Session found, redirecting...');
            
            // Try to create profile automatically
            if (session.access_token) {
              await createUserProfile(session.access_token);
            }
            
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            
            // Get intended destination and redirect
            const intendedDestination = getIntendedDestination();
            clearIntendedPath();
            
            setTimeout(() => {
              navigate(intendedDestination, { replace: true });
            }, 1500);
          } else {
            // No session and no hash - this might be a direct visit
            throw new Error('No authentication data found');
          }
        }
        
      } catch (error) {
        console.error('❌ Auth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');
        
        // Clear any stored intended path on error
        clearIntendedPath();
        
        // Redirect back to login after error
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">Authentication</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <p className="text-green-600 font-medium">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-red-600" />
              <p className="text-red-600 font-medium">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to login...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
