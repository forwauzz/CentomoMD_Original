import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authClient';
import { AuthWidget } from '@/components/AuthWidget';
import { Plus } from 'lucide-react';

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
      {/* CNESST green gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#007a2e] via-[#009639] to-[#009639]" />
      {/* Subtle radial accents */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(closest-side, #dfe8f5, transparent)' }} />
      <div className="pointer-events-none absolute right-[-120px] top-[-120px] h-[420px] w-[420px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(closest-side, #b9cbe6, transparent)' }} />

      {/* Left Section - Simplified Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-8 text-white relative z-10">
        <div className="max-w-md text-center">
          {/* Branding */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center mr-3">
              <Plus className="w-6 h-6 text-[#009639]" />
            </div>
            <h1 className="text-3xl font-bold">techemd</h1>
          </div>
          
          {/* Main Title */}
          <h2 className="text-4xl font-bold mb-6">Secure Medical Professional Access</h2>
          
          {/* Simple tagline */}
          <p className="text-lg text-slate-200">
            Professional medical documentation platform for Quebec healthcare professionals.
          </p>
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
