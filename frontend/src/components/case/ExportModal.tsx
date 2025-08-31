import React, { useState } from 'react';
import { Download, FileText, FileCode, Eye, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string, bilingual: boolean) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  const { t } = useI18n();
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [bilingual, setBilingual] = useState<boolean>(false);

  if (!isOpen) return null;

  const exportFormats = [
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Document portable pour impression et partage',
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      id: 'docx',
      name: 'DOCX',
      description: 'Document Word modifiable',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'json',
      name: 'JSON',
      description: 'Données structurées pour intégration',
      icon: FileCode,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  const handleExport = () => {
    onExport(selectedFormat, bilingual);
    onClose();
  };

  const handlePreview = () => {
    // TODO: Implement preview functionality
    console.log('Preview clicked');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-700">
              {t('exportForm')}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </Button>
          </div>

          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                {t('exportFormat')}
              </Label>
              <div className="space-y-2">
                {exportFormats.map((format) => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                        selectedFormat === format.id
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${format.bgColor}`}>
                          <Icon className={`h-5 w-5 ${format.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{format.name}</div>
                          <div className="text-sm text-gray-500">{format.description}</div>
                        </div>
                        {selectedFormat === format.id && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bilingual Option */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bilingual"
                checked={bilingual}
                onCheckedChange={(checked) => setBilingual(checked as boolean)}
              />
              <Label htmlFor="bilingual" className="text-sm text-gray-700">
                {t('bilingualExport')}
              </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handlePreview}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                {t('preview')}
              </Button>
              <Button
                onClick={handleExport}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('export')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
