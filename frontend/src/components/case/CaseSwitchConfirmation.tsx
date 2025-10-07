import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface CaseSwitchConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  currentCaseId?: number;
  locale?: 'en-CA' | 'fr-CA';
}

export const CaseSwitchConfirmation: React.FC<CaseSwitchConfirmationProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  currentCaseId,
  locale = 'en-CA'
}) => {
  if (!isOpen) return null;

  // Localized messages
  const messages = {
    'en-CA': {
      title: 'Save Current Case?',
      description: currentCaseId 
        ? `You have an active case (ID: ${currentCaseId}). Do you want to save the current case before starting a new one?`
        : 'You have an active case. Do you want to save the current case before starting a new one?',
      yesButton: 'Yes, Save & Start New',
      noButton: 'No, Keep Current',
      warning: 'Starting a new case will save your current progress.'
    },
    'fr-CA': {
      title: 'Sauvegarder le cas actuel?',
      description: currentCaseId 
        ? `Vous avez un cas actif (ID: ${currentCaseId}). Voulez-vous sauvegarder le cas actuel avant d\'en commencer un nouveau?`
        : 'Vous avez un cas actif. Voulez-vous sauvegarder le cas actuel avant d\'en commencer un nouveau?',
      yesButton: 'Oui, Sauvegarder et Nouveau',
      noButton: 'Non, Garder l\'actuel',
      warning: 'Commencer un nouveau cas sauvegardera votre progression actuelle.'
    }
  };

  const t = messages[locale];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
          <CardTitle className="text-lg">{t.title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {t.warning}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center">
            {t.description}
          </p>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              {t.noButton}
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1"
            >
              {t.yesButton}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
