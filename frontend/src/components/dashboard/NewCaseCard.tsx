import React from 'react';
import { NewCaseWithClinicSelection } from '@/components/case/NewCaseWithClinicSelection';

export const NewCaseCard: React.FC = () => {

  const handleCaseCreated = (caseId: string) => {
    // Case is already created and user is navigated by NewCaseWithClinicSelection
    // This callback can be used for additional actions if needed
    console.log('New case created with clinic selection:', caseId);
  };

  return (
    <div className="space-y-4">
      {/* New Case with Clinic Selection */}
      <NewCaseWithClinicSelection onCaseCreated={handleCaseCreated} />
      
      {/* Recent Cases toggle removed to avoid duplication on dashboard */}
    </div>
  );
};
