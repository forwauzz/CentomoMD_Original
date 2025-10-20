import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureFlags } from '@/lib/featureFlags';
import { RecentCasesCard } from './RecentCasesCard';
import { NewCaseWithClinicSelection } from '@/components/case/NewCaseWithClinicSelection';

export const NewCaseCard: React.FC = () => {
  const featureFlags = useFeatureFlags();
  
  const [showRecentCases, setShowRecentCases] = useState(false);

  const handleCaseCreated = (caseId: string) => {
    // Case is already created and user is navigated by NewCaseWithClinicSelection
    // This callback can be used for additional actions if needed
    console.log('New case created with clinic selection:', caseId);
  };

  return (
    <div className="space-y-4">
      {/* New Case with Clinic Selection */}
      <NewCaseWithClinicSelection onCaseCreated={handleCaseCreated} />
      
      {/* Recent Cases Toggle */}
      {featureFlags.caseManagement && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRecentCases(!showRecentCases)}
          className="w-full text-xs"
        >
          <Clock className="h-3 w-3 mr-2" />
          {showRecentCases ? 'Hide' : 'Show'} Recent Cases
          {showRecentCases ? (
            <ChevronDown className="h-3 w-3 ml-2" />
          ) : (
            <ChevronRight className="h-3 w-3 ml-2" />
          )}
        </Button>
      )}
      
      {/* Recent Cases Submenu */}
      {showRecentCases && featureFlags.caseManagement && (
        <RecentCasesCard />
      )}
    </div>
  );
};
