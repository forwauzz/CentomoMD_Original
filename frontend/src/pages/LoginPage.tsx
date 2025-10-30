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
    <div className="min-h-screen relative flex">
      {/* Navy gradient background to match landing */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#061a30] via-[#0b2a4f] to-[#0b2a4f]" />
      {/* Subtle radial accents */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(closest-side, #dfe8f5, transparent)' }} />
      <div className="pointer-events-none absolute right-[-120px] top-[-120px] h-[420px] w-[420px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(closest-side, #b9cbe6, transparent)' }} />

      {/* Left Section - Branding and Features */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-8 text-white relative z-10">
        <div>
          {/* Branding */}
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center mr-3">
              <Plus className="w-5 h-5 text-[#0b2a4f]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">CentomoMD</h1>
              <p className="text-sm text-slate-200">Professional Medical Documentation</p>
            </div>
          </div>
          
          {/* Main Title */}
          <h2 className="text-3xl font-bold mb-8">Secure Medical Professional Access</h2>
          
          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#0a3463] rounded-lg flex items-center justify-center mr-4">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">CNESST Form Automation</h3>
                <p className="text-slate-200 text-sm">Streamlined medical documentation</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#0a3463] rounded-lg flex items-center justify-center mr-4">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Voice-Powered Documentation</h3>
                <p className="text-slate-200 text-sm">Real-time transcription and dictation</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#0a3463] rounded-lg flex items-center justify-center mr-4">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">AI-Enhanced Medical Formatting</h3>
                <p className="text-slate-200 text-sm">Intelligent template suggestions</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#0a3463] rounded-lg flex items-center justify-center mr-4">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Quebec Healthcare Compliant</h3>
                <p className="text-slate-200 text-sm">HIPAA, PIPEDA, and Law 25 compliant</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-slate-300 text-sm">
          <p>&copy; 2024 CentomoMD. All rights reserved.</p>
          <p>Secure medical documentation platform for Quebec healthcare professionals.</p>
        </div>
      </div>
      
      {/* Right Section - Login Form */}
      <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-xl shadow-2xl p-4 sm:p-6">
          <AuthWidget />
        </div>
      </div>
    </div>
  );
};
