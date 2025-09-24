import React, { useState } from 'react';
import { CheckCircle, Circle, FileText, Download, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { CNESST_SECTIONS, getSectionTitle } from '@/lib/constants';
import { useCaseStore } from '@/stores/caseStore';
import { getSelectedClinic } from '@/lib/clinicSession';
import { getDevUser } from '@/lib/devAuth';

interface SecondarySectionNavProps {
  onExport: () => void;
}

export const SecondarySectionNav: React.FC<SecondarySectionNavProps> = ({ onExport }) => {
  const { t, language } = useI18n();
  const { activeSectionId, getSectionStatus, setActiveSection, saveCaseToDatabase } = useCaseStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const getStatusIcon = (sectionId: string) => {
    const status = getSectionStatus(sectionId);
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Circle className="h-4 w-4 text-blue-600 fill-current" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (sectionId: string) => {
    const status = getSectionStatus(sectionId);
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-white border-gray-200';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Get user and clinic IDs from session/auth
      const devUser = getDevUser();
      const selectedClinic = getSelectedClinic();
      
      // Use dev user ID and selected clinic ID (or fallback to dev user's clinic_id)
      const userId = devUser.id;
      const clinicId = selectedClinic?.id || devUser.clinic_id;

      if (!clinicId) {
        throw new Error('No clinic selected. Please select a clinic before saving.');
      }

      const result = await saveCaseToDatabase(userId, clinicId);

      if (result.success) {
        setSaveStatus('success');
        // Reset success status after 3 seconds
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        console.error('Save failed:', result.error);
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-slate-700">
          {t('cnesstForm204')}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {t('formSections')}
        </p>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2 space-y-1">
          {CNESST_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer',
                activeSectionId === section.id
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : getStatusColor(section.id)
              )}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(section.id)}
                                 <div className="flex-1 min-w-0">
                   <div className="text-sm font-medium truncate">
                     {getSectionTitle(section, language)}
                   </div>
                  {section.audioRequired && (
                    <div className="flex items-center gap-1 mt-1">
                      <FileText className="h-3 w-3 text-orange-500" />
                      <span className="text-xs text-orange-600">
                        {t('audioRequired')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "w-full",
            saveStatus === 'success' 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : saveStatus === 'error'
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-gray-600 hover:bg-gray-700 text-white"
          )}
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving 
            ? (language === 'fr' ? 'Sauvegarde...' : 'Saving...')
            : saveStatus === 'success'
            ? (language === 'fr' ? 'Sauvegardé!' : 'Saved!')
            : saveStatus === 'error'
            ? (language === 'fr' ? 'Erreur' : 'Error')
            : (language === 'fr' ? 'Sauvegarder' : 'Save')
          }
        </Button>

        {/* Export Button */}
        <Button
          onClick={onExport}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          {t('exportForm')}
        </Button>
      </div>
    </div>
  );
};
