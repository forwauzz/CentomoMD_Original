import React from 'react';
import { CheckCircle, Circle, FileText, Download, Clock, AlertCircle, Save, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { CNESST_SECTIONS, getSectionTitle } from '@/lib/constants';
import { useCaseStore } from '@/stores/caseStore';
import { getSectionIds, getSectionMeta, isSchemaDrivenEnabled } from '@/lib/formSchema';

interface SecondarySectionNavProps {
  onExport: () => void;
}

export const SecondarySectionNav: React.FC<SecondarySectionNavProps> = ({ onExport }) => {
  const { t, language } = useI18n();
  const { activeSectionId, getSectionStatus, getAutosaveTimestamp, setActiveSection, currentCase, completeCase, markCaseInProgress, hasUnsavedChanges } = useCaseStore();

  // Get sections based on feature flag
  const sections = isSchemaDrivenEnabled() ? getSectionIds() : CNESST_SECTIONS.map(s => s.id);

  const getStatusIcon = (sectionId: string) => {
    const status = getSectionStatus(sectionId);
    const lastSaved = getAutosaveTimestamp(sectionId);
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return lastSaved ? 
          <Save className="h-4 w-4 text-blue-600" /> : 
          <Circle className="h-4 w-4 text-blue-600 fill-current" />;
      case 'saving':
        return <Clock className="h-4 w-4 text-yellow-600 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
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
      case 'saving':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-white border-gray-200';
    }
  };

  const getLastSavedText = (sectionId: string) => {
    const lastSaved = getAutosaveTimestamp(sectionId);
    if (!lastSaved) return null;
    
    const savedDate = new Date(lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - savedDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Sauvé maintenant';
    if (diffMins < 60) return `Sauvé il y a ${diffMins}min`;
    if (diffMins < 1440) return `Sauvé il y a ${Math.floor(diffMins / 60)}h`;
    return `Sauvé le ${savedDate.toLocaleDateString()}`;
  };

  const getSectionProgress = (sectionId: string) => {
    if (!currentCase?.draft?.sections?.[sectionId]) return 0;
    
    const sectionData = currentCase.draft.sections[sectionId].data;
    if (!sectionData) return 0;
    
    const fields = Object.keys(sectionData);
    const filledFields = fields.filter(field => {
      const value = (sectionData as any)[field];
      return value !== null && value !== undefined && value !== '';
    });
    
    return fields.length > 0 ? Math.round((filledFields.length / fields.length) * 100) : 0;
  };

  const getOverallProgress = () => {
    if (!currentCase?.draft?.sections) return 0;
    
    const sectionIds = Object.keys(currentCase.draft.sections);
    if (sectionIds.length === 0) return 0;
    
    const totalProgress = sectionIds.reduce((sum, sectionId) => {
      return sum + getSectionProgress(sectionId);
    }, 0);
    
    return Math.round(totalProgress / sectionIds.length);
  };

  const handleCompleteCase = async () => {
    if (!currentCase?.id) return;
    
    try {
      await completeCase(currentCase.id);
      console.log('✅ Case completed successfully');
    } catch (error) {
      console.error('❌ Failed to complete case:', error);
    }
  };

  const handleMarkInProgress = async () => {
    if (!currentCase?.id) return;
    
    try {
      await markCaseInProgress(currentCase.id);
      console.log('✅ Case marked as in progress');
    } catch (error) {
      console.error('❌ Failed to mark case as in progress:', error);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-700">
            {t('cnesstForm204')}
          </h2>
          {hasUnsavedChanges() && (
            <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              <AlertCircle className="h-3 w-3" />
              <span>Non sauvegardé</span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {t('formSections')}
        </p>
        
        {/* Overall Progress */}
        {currentCase && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Progrès global</span>
              <span>{getOverallProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getOverallProgress()}%` }}
              />
            </div>
            
            {/* Case Status and Actions */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Statut:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  currentCase.status === 'completed' ? 'bg-green-100 text-green-800' :
                  currentCase.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentCase.status === 'completed' ? 'Terminé' :
                   currentCase.status === 'in_progress' ? 'En cours' :
                   'Brouillon'}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-1">
                {currentCase.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCompleteCase}
                    className="flex-1 text-xs h-7"
                  >
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Terminer
                  </Button>
                )}
                {currentCase.status === 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMarkInProgress}
                    className="flex-1 text-xs h-7"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Reprendre
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Sections List */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2 space-y-1">
          {sections.map((sectionId) => {
            const sectionMeta = isSchemaDrivenEnabled() ? getSectionMeta(sectionId) : null;
            const legacySection = CNESST_SECTIONS.find(s => s.id === sectionId);
            
            const title = sectionMeta?.title || (legacySection ? getSectionTitle(legacySection, language) : sectionId);
            const audioRequired = sectionMeta?.audioRequired || legacySection?.audioRequired || false;
            
            const progress = getSectionProgress(sectionId);
            const lastSavedText = getLastSavedText(sectionId);
            
            return (
              <button
                key={sectionId}
                onClick={() => setActiveSection(sectionId)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer',
                  activeSectionId === sectionId
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : getStatusColor(sectionId)
                )}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(sectionId)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {title}
                    </div>
                    
                    {/* Progress Bar */}
                    {progress > 0 && (
                      <div className="mt-1">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progrès</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Last Saved Info */}
                    {lastSavedText && (
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {lastSavedText}
                        </span>
                      </div>
                    )}
                    
                    {/* Audio Required */}
                    {audioRequired && (
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
            );
          })}
        </nav>
      </div>

      {/* Export Button */}
      <div className="p-4 border-t border-gray-200">
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
