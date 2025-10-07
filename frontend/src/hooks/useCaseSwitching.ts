import { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useCaseStore } from '@/stores/caseStore';
import { useUserStore } from '@/stores/userStore';
import { useAuth } from '@/lib/authClient';

interface UseCaseSwitchingReturn {
  showConfirmation: boolean;
  currentCaseId: number | null;
  startNewCase: () => void;
  handleConfirmSwitch: () => Promise<void>;
  handleCancelSwitch: () => void;
  isProcessing: boolean;
}

export const useCaseSwitching = (): UseCaseSwitchingReturn => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { hasActiveCase: sessionHasActiveCase, getCurrentCaseId: getSessionCaseId, switchToNewCase } = useSessionStore();
  const { hasActiveCase: caseHasActiveCase, getCurrentCaseId: getCaseId, startNewCase } = useCaseStore();
  const { profile } = useUserStore();
  const { user } = useAuth();

  const currentCaseId = getSessionCaseId() || getCaseId();

  const handleStartNewCase = () => {
    // Check if there's an active case in either session or case store
    if (sessionHasActiveCase() || caseHasActiveCase()) {
      setShowConfirmation(true);
    } else {
      // No active case, proceed directly
      handleConfirmSwitch();
    }
  };

  const handleConfirmSwitch = async () => {
    setIsProcessing(true);
    setShowConfirmation(false);

    try {
      // Get user and clinic IDs from auth and profile or use defaults
      const userId = user?.id || '00000000-0000-0000-0000-000000000001';
      const clinicId = profile?.default_clinic_id || user?.clinic_id || '3267cef9-9a11-4e1a-a0c4-c1309538b952';

      // Start new case (this now creates a case ID immediately)
      const caseResult = await startNewCase(userId, clinicId);
      
      if (!caseResult.success) {
        console.error('Failed to start new case:', caseResult.error);
        return;
      }

      // If there's an active session, update it with the new case ID
      if (sessionHasActiveCase() && caseResult.caseId) {
        const sessionResult = await switchToNewCase(caseResult.caseId);
        
        if (!sessionResult.success) {
          console.error('Failed to update session with new case ID:', sessionResult.error);
        } else {
          console.log('✅ Successfully switched to new case and updated session');
        }
      } else {
        console.log('✅ Successfully started new case with ID:', caseResult.caseId);
      }
    } catch (error) {
      console.error('❌ Error switching to new case:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSwitch = () => {
    setShowConfirmation(false);
  };

  return {
    showConfirmation,
    currentCaseId,
    startNewCase: handleStartNewCase,
    handleConfirmSwitch,
    handleCancelSwitch,
    isProcessing,
  };
};
