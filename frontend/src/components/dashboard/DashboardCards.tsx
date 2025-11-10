import React from 'react';
// New Case, Recent Cases, and Profile cards hidden from dashboard
// import { NewCaseCard } from './NewCaseCard';
import { StartDictationCard } from './StartDictationCard';
// import { RecentCasesCard } from './RecentCasesCard';
// import { ProfileCard } from './ProfileCard';

export const DashboardCards: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {/* New Case card hidden */}
      {/* <div className="animate-in slide-in-from-bottom-2 duration-500">
        <NewCaseCard />
      </div> */}
      {/* Recent Cases card hidden */}
      {/* <div className="animate-in slide-in-from-bottom-2 duration-500 delay-100">
        <RecentCasesCard />
      </div> */}
      <div className="animate-in slide-in-from-bottom-2 duration-500 delay-200">
        <StartDictationCard />
      </div>
      {/* Profile card hidden */}
      {/* <div className="animate-in slide-in-from-bottom-2 duration-500 delay-300">
          <ProfileCard />
        </div> */}
      </div>
    </div>
  );
};
