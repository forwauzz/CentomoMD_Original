import React, { useEffect, useState } from 'react';
import { SecondarySectionNav } from '@/components/case/SecondarySectionNav';
import { SectionForm } from '@/components/case/SectionForm';
import { DictationPanel } from '@/components/case/DictationPanel';
import { ExportModal } from '@/components/case/ExportModal';
import { useI18n } from '@/lib/i18n';
import { useCaseStore } from '@/stores/caseStore';
import { CNESST_SECTIONS, getSectionTitle } from '@/lib/constants';

export const NewCasePage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeSectionId, initializeCase, setActiveSection, updateSectionTitles } = useCaseStore();
  const [showExportModal, setShowExportModal] = useState(false);

  // Initialize case with all sections when component mounts
  useEffect(() => {
    const sections = CNESST_SECTIONS.map(section => ({
      id: section.id,
      title: getSectionTitle(section, language),
      status: 'not_started' as const,
      data: {},
      lastModified: new Date().toISOString(),
      audioRequired: section.audioRequired,
    }));
    
    initializeCase(sections);
    
    // Set first section as active if none is selected
    if (!activeSectionId && sections.length > 0) {
      setActiveSection(sections[0].id);
    }
  }, [initializeCase, setActiveSection, language]); // Removed activeSectionId from dependencies

  // Update section titles when language changes
  useEffect(() => {
    const sectionTitles = CNESST_SECTIONS.reduce((acc, section) => {
      acc[section.id] = getSectionTitle(section, language);
      return acc;
    }, {} as Record<string, string>);
    
    updateSectionTitles(sectionTitles);
  }, [language, updateSectionTitles]);

  const currentSection = CNESST_SECTIONS.find(s => s.id === activeSectionId);



  const handleExport = (format: string, bilingual: boolean) => {
    // TODO: Implement export functionality
    console.log('Exporting:', { format, bilingual });
  };

  if (!activeSectionId || !currentSection) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Secondary Navigation */}
      <SecondarySectionNav onExport={() => setShowExportModal(true)} />
      
      {/* Main Form Area */}
      <div className="flex-1 flex">
        <div className="flex-1">
          <SectionForm sectionId={activeSectionId} />
        </div>
        
        {/* Dictation Panel - Only show for audio-required sections */}
        {currentSection.audioRequired && (
          <DictationPanel sectionTitle={getSectionTitle(currentSection, language)} />
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />
    </div>
  );
};
