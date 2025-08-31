import React from 'react';
import { NewCaseCard } from './NewCaseCard';
import { FormsCompletedCard } from './FormsCompletedCard';
import { TranscriptionsCard } from './TranscriptionsCard';
import { PatientsCard } from './PatientsCard';
import { StartDictationCard } from './StartDictationCard';

export const DashboardCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      <div className="animate-in slide-in-from-bottom-2 duration-500">
        <NewCaseCard />
      </div>
      <div className="animate-in slide-in-from-bottom-2 duration-500 delay-100">
        <FormsCompletedCard />
      </div>
      <div className="animate-in slide-in-from-bottom-2 duration-500 delay-200">
        <TranscriptionsCard />
      </div>
      <div className="animate-in slide-in-from-bottom-2 duration-500 delay-300">
        <PatientsCard />
      </div>
      <div className="animate-in slide-in-from-bottom-2 duration-500 delay-400">
        <StartDictationCard />
      </div>
    </div>
  );
};
