import React from 'react';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="flex items-center space-x-3 p-8 bg-white rounded-lg shadow-md max-w-md">
        <Shield className="h-12 w-12 text-orange-500" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={() => navigate(-1)} 
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center justify-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Go to Dashboard</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
