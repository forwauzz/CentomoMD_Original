import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authClient';
import { AuthWidget } from '@/components/AuthWidget';
import { FileText, Mic, Brain, CheckCircle, Plus } from 'lucide-react';

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
    <div className="min-h-screen flex">
      {/* Left Section - Branding and Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 flex-col justify-between p-8 text-white">
        <div>
          {/* Branding */}
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center mr-3">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">CentomoMD</h1>
              <p className="text-sm text-blue-100">Professional Medical Documentation</p>
            </div>
          </div>
          
          {/* Main Title */}
          <h2 className="text-3xl font-bold mb-8">Secure Medical Professional Access</h2>
          
          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">CNESST Form Automation</h3>
                <p className="text-blue-100 text-sm">Streamlined medical documentation</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Voice-Powered Documentation</h3>
                <p className="text-blue-100 text-sm">Real-time transcription and dictation</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">AI-Enhanced Medical Formatting</h3>
                <p className="text-blue-100 text-sm">Intelligent template suggestions</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Quebec Healthcare Compliant</h3>
                <p className="text-blue-100 text-sm">HIPAA, PIPEDA, and Law 25 compliant</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-blue-100 text-sm">
          <p>&copy; 2024 CentomoMD. All rights reserved.</p>
          <p>Secure medical documentation platform for Quebec healthcare professionals.</p>
        </div>
      </div>
      
      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <AuthWidget />
        </div>
      </div>
    </div>
  );
};
