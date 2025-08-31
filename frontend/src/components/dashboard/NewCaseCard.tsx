import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants';

export const NewCaseCard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleNewCase = () => {
    navigate(ROUTES.NEW_CASE);
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-700">
            {t('startNewCase')}
          </CardTitle>
          <div className="p-2 bg-blue-50 rounded-lg">
            <Plus className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600 text-sm">
          Commencer un nouveau dossier CNESST avec tous les formulaires requis
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FileText className="h-3 w-3" />
          <span>15 sections disponibles</span>
        </div>
        <Button 
          onClick={handleNewCase}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('newCase')}
        </Button>
      </CardContent>
    </Card>
  );
};
