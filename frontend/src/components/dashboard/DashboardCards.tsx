import React from 'react';
import { StartDictationCard } from './StartDictationCard';
import { ActiveCasesCard } from './ActiveCasesCard';
import { InReviewCard } from './InReviewCard';
import { ReadyToSubmitCard } from './ReadyToSubmitCard';

export const DashboardCards: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="animate-in slide-in-from-bottom-2 duration-500">
          <ActiveCasesCard />
        </div>
        <div className="animate-in slide-in-from-bottom-2 duration-500 delay-100">
          <InReviewCard />
        </div>
        <div className="animate-in slide-in-from-bottom-2 duration-500 delay-200">
          <ReadyToSubmitCard />
        </div>
        <div className="animate-in slide-in-from-bottom-2 duration-500 delay-300">
          <StartDictationCard />
        </div>
      </div>
    </div>
  );
};
