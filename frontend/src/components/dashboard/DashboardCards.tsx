import React from 'react';
import { NewCaseCard } from './NewCaseCard';
import { FormsCompletedCard } from './FormsCompletedCard';
import { TranscriptionsCard } from './TranscriptionsCard';
import { PatientsCard } from './PatientsCard';
import { StartDictationCard } from './StartDictationCard';

export const DashboardCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NewCaseCard />
      <FormsCompletedCard />
      <TranscriptionsCard />
      <PatientsCard />
      <StartDictationCard />
    </div>
  );
};
