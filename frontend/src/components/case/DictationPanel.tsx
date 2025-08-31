import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants';

interface DictationPanelProps {
  sectionTitle: string;
}

export const DictationPanel: React.FC<DictationPanelProps> = ({ sectionTitle }) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleGoToDictation = () => {
    navigate(ROUTES.DICTATION);
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-slate-700">
              {t('dictation')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Cette section nécessite une dictée audio pour compléter le rapport.
            </p>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Section actuelle:</p>
                  <p>{sectionTitle}</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• Transcription en temps réel</p>
              <p>• Précision IA de 98.5%</p>
              <p>• Sauvegarde automatique</p>
            </div>
          </div>

          <Button
            onClick={handleGoToDictation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Mic className="h-4 w-4 mr-2" />
            {t('goToDictation')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
