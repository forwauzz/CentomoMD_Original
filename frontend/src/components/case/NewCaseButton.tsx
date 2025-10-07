import React from 'react';
import { Button } from '@/components/ui/button';
import { CaseSwitchConfirmation } from './CaseSwitchConfirmation';
import { useCaseSwitching } from '@/hooks/useCaseSwitching';
import { useUserStore } from '@/stores/userStore';
import { Plus } from 'lucide-react';

interface NewCaseButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export const NewCaseButton: React.FC<NewCaseButtonProps> = ({
  variant = 'default',
  size = 'default',
  className = '',
  children
}) => {
  const { 
    showConfirmation, 
    currentCaseId, 
    startNewCase, 
    handleConfirmSwitch, 
    handleCancelSwitch, 
    isProcessing 
  } = useCaseSwitching();
  
  const { profile } = useUserStore();
  const locale = profile?.locale || 'en-CA';

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={startNewCase}
        disabled={isProcessing}
      >
        {isProcessing ? (
          'Starting...'
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            {children || 'New Case'}
          </>
        )}
      </Button>

      <CaseSwitchConfirmation
        isOpen={showConfirmation}
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
        currentCaseId={currentCaseId}
        locale={locale}
      />
    </>
  );
};
