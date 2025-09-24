import React from 'react';
import { NewCaseCard } from './NewCaseCard';
import { FormsCompletedCard } from './FormsCompletedCard';
import { TranscriptionsCard } from './TranscriptionsCard';
import { PatientsCard } from './PatientsCard';
import { StartDictationCard } from './StartDictationCard';

export const DashboardCards: React.FC = () => {
  try {
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
  } catch (error) {
    console.error('Error rendering DashboardCards:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">Error Loading Dashboard Cards</h3>
        <p className="text-red-600 text-sm mt-1">
          There was an error loading the dashboard cards. Please check the console for details.
        </p>
      </div>
    );
  }
};
