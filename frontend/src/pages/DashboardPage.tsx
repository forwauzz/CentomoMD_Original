import React from 'react';
 
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { useAuth } from '@/lib/authClient';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="-mx-4 lg:-mx-6">
        <div className="w-full bg-white text-slate-800">
          <div className="px-4 lg:px-6 py-10 md:py-14">
            <h1 className="font-semibold tracking-tight text-center text-3xl md:text-5xl lg:text-6xl">
              {`Welcome Back${user ? `, ${user.name || user.email}` : ''}`}
            </h1>
          </div>
        </div>
      </div>

      <DashboardCards />
    </div>
  );
};
