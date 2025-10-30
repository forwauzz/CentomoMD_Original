import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/authClient';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Navy gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#061a30] via-[#0b2a4f] to-[#0b2a4f]" />

      {/* Subtle light radial accents */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(closest-side, #dfe8f5, transparent)' }} />
      <div className="pointer-events-none absolute right-[-120px] top-[-120px] h-[520px] w-[520px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(closest-side, #b9cbe6, transparent)' }} />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center text-white">
        <h1 className="text-6xl md:text-7xl font-serif tracking-tight">centomomd</h1>
        <p className="mt-6 max-w-2xl text-lg md:text-xl text-slate-200">
          The intelligent platform for modern medical documentation
        </p>
        <div className="mt-10">
          <Button
            size="lg"
            className="bg-[#072544] hover:bg-[#0a3463] text-white px-8 py-6 rounded-xl shadow-xl"
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
        </div>

        {/* Footer links */}
        <div className="absolute bottom-6 inset-x-0 flex items-center justify-center space-x-6 text-sm text-slate-300">
          <a className="hover:text-white" href="#">Privacy Policy</a>
          <span className="opacity-50">•</span>
          <a className="hover:text-white" href="#">Terms of Service</a>
          <span className="opacity-50">•</span>
          <a className="hover:text-white" href="#">Contact</a>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;


