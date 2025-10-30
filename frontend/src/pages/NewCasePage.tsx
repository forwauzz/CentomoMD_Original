import React, { useEffect, useState, useRef } from 'react';
import { SecondarySectionNav } from '@/components/case/SecondarySectionNav';
import { SectionForm } from '@/components/case/SectionForm';
import { DictationPanel } from '@/components/case/DictationPanel';
import { ExportModal } from '@/components/case/ExportModal';
import { NavigationGuard } from '@/components/case/NavigationGuard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit2, Check, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCaseStore } from '@/stores/caseStore';
import { CNESST_SECTIONS, getSectionTitle } from '@/lib/constants';
import { isSchemaDrivenEnabled } from '@/lib/formSchema';

export const NewCasePage: React.FC = () => {
  const { language } = useI18n();
  const { activeSectionId, initializeCase, setActiveSection, updateSectionTitles, schema, loadSchema, currentCase, loadNewCase, updateCaseName } = useCaseStore();
  const [showExportModal, setShowExportModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [caseName, setCaseName] = useState('');
  const [tempCaseName, setTempCaseName] = useState('');
  const lastIdRef = useRef<string | null>(null);

  // Handle URL parameters for section navigation and case loading
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sectionParam = urlParams.get('section');
    const caseIdParam = urlParams.get('caseId');
    
    if (sectionParam && sectionParam !== activeSectionId) {
      console.log('🔍 [NewCasePage] URL section parameter found:', sectionParam);
      setActiveSection(sectionParam);
    }
    
    // Load existing case if caseId is provided and different from last loaded
    if (caseIdParam && caseIdParam !== lastIdRef.current) {
      console.info("[NewCasePage] init", { caseId: caseIdParam });
      lastIdRef.current = caseIdParam;
      loadNewCase(caseIdParam).then((loadedCase) => {
        if (loadedCase) {
          console.log('✅ [NewCasePage] Case loaded successfully:', loadedCase.id);
          
          // Ensure schema is loaded for proper section initialization
          if (!schema) {
            console.log('🔍 [NewCasePage] Loading schema for loaded case...');
            loadSchema().then(() => {
              // The schema will be available in the next render cycle
              console.log('🔍 [NewCasePage] Schema loaded, will set active section in next render');
            }).catch((error) => {
              console.error('❌ [NewCasePage] Failed to load schema:', error);
            });
          } else {
            // Schema already loaded, set active section
            if (schema && schema.ui.order.length > 0) {
              const firstSectionId = schema.ui.order[0];
              console.log('🔍 [NewCasePage] Setting active section to:', firstSectionId);
              setActiveSection(firstSectionId);
            } else {
              console.warn('⚠️ [NewCasePage] Schema exists but no sections found');
            }
          }
        } else {
          console.error('❌ [NewCasePage] Failed to load case:', caseIdParam);
          lastIdRef.current = null; // Reset on failure
        }
      });
    }
  }, [currentCase, activeSectionId, loadNewCase, setActiveSection, lastIdRef.current]);

  // Set active section when schema becomes available after loading a case
  useEffect(() => {
    if (currentCase && schema && !activeSectionId && schema.ui.order.length > 0) {
      const firstSectionId = schema.ui.order[0];
      console.log('🔍 [NewCasePage] Setting active section after schema loaded:', firstSectionId);
      setActiveSection(firstSectionId);
    }
  }, [currentCase, schema, activeSectionId, setActiveSection]);

  // Initialize case with all sections when component mounts
  useEffect(() => {
    // Check if we're loading an existing case
    const urlParams = new URLSearchParams(window.location.search);
    const caseIdParam = urlParams.get('caseId');
    
    // Prevent multiple initializations if case already exists or we're loading an existing case
    if (currentCase || caseIdParam) {
      console.log('🔍 [NewCasePage] Already initialized, case exists, or loading existing case, skipping...');
      return;
    }
    
    console.log('🔍 [NewCasePage] Component mounted, initializing case...');
    
    // Load schema first if not already loaded
    if (!schema) {
      console.log('🔍 [NewCasePage] Loading schema...');
      loadSchema();
      return; // Exit early to wait for schema to load
    }
    
    // Initialize case with sections
    
    // Use schema-driven sections if available, otherwise fallback to legacy
    if (schema && isSchemaDrivenEnabled()) {
      console.log('🔍 [NewCasePage] Using schema-driven sections');
      const sections = schema.ui.order.map(sectionId => {
        const sectionMeta = schema.sections[sectionId];
        return {
          id: sectionId,
          title: sectionMeta?.title || sectionId,
          status: 'not_started' as const,
          data: {},
          lastModified: new Date().toISOString(),
          audioRequired: sectionMeta?.audioRequired || false,
        };
      });
      
      console.log('🔍 [NewCasePage] Schema sections:', sections.map(s => s.id));
      initializeCase(sections);
      
      // Set first section as active if none is selected
      if (!activeSectionId && sections.length > 0) {
        console.log('🔍 [NewCasePage] Setting active section to:', sections[0].id);
        setActiveSection(sections[0].id);
      }
    } else {
      console.log('🔍 [NewCasePage] Using legacy sections');
      const sections = CNESST_SECTIONS.map(section => ({
        id: section.id,
        title: getSectionTitle(section, language),
        status: 'not_started' as const,
        data: {},
        lastModified: new Date().toISOString(),
        audioRequired: section.audioRequired,
      }));
      
      console.log('🔍 [NewCasePage] Legacy sections:', sections.map(s => s.id));
      initializeCase(sections);
      
      // Set first section as active if none is selected
      if (!activeSectionId && sections.length > 0) {
        console.log('🔍 [NewCasePage] Setting active section to:', sections[0].id);
        setActiveSection(sections[0].id);
      }
    }
  }, [schema, currentCase]); // Depend on schema and currentCase to prevent infinite loops

  // Update section titles when language changes
  useEffect(() => {
    const sectionTitles = CNESST_SECTIONS.reduce((acc, section) => {
      acc[section.id] = getSectionTitle(section, language);
      return acc;
    }, {} as Record<string, string>);
    
    updateSectionTitles(sectionTitles);
  }, [language, updateSectionTitles]);

  // Sync case name with current case
  useEffect(() => {
    if (currentCase?.name) {
      setCaseName(currentCase.name);
    } else {
      // Reset to default when no case or new case
      setCaseName('Nouveau cas');
    }
  }, [currentCase?.id, currentCase?.name]);

  // Resolve section existence, audio flag and title safely for both schema and legacy
  const schemaSection = (isSchemaDrivenEnabled() && schema) ? schema.sections[activeSectionId] : undefined;
  const legacySection = CNESST_SECTIONS.find(s => s.id === activeSectionId);
  const hasSection = schemaSection ? true : !!legacySection;
  const audioRequired = schemaSection ? !!schemaSection.audioRequired : !!legacySection?.audioRequired;
  const sectionTitle = schemaSection ? (schemaSection.title || activeSectionId) : (legacySection ? getSectionTitle(legacySection, language) : activeSectionId);



  const handleExport = (format: string, bilingual: boolean) => {
    // TODO: Implement export functionality
    console.log('Exporting:', { format, bilingual });
  };

  // Case name editing functions
  const handleEditName = () => {
    setTempCaseName(caseName);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (currentCase && tempCaseName.trim()) {
      try {
        await updateCaseName(currentCase.id, tempCaseName.trim());
        setCaseName(tempCaseName.trim());
        setIsEditingName(false);
      } catch (error) {
        console.error('Failed to update case name:', error);
        // Reset to original name on error
        setTempCaseName(caseName);
      }
    }
  };

  const handleCancelEdit = () => {
    setTempCaseName(caseName);
    setIsEditingName(false);
  };

  if (!activeSectionId || !hasSection) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <NavigationGuard>
      <div className="h-full flex flex-col">
      {/* Case Name Editor */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Nom du cas:</span>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempCaseName}
                onChange={(e) => setTempCaseName(e.target.value)}
                className="h-8 w-64"
                placeholder="Nom du cas"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <Button
                size="sm"
                onClick={handleSaveName}
                className="h-8 w-8 p-0"
                disabled={!tempCaseName.trim()}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900">{caseName || 'Nouveau cas'}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEditName}
                className="h-6 w-6 p-0"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content Area - Left to Right Layout */}
      <div className="flex-1 flex">
        {/* Left Side - Section Navigation */}
        <div className="w-80 border-r border-gray-200 bg-gray-50">
          <SecondarySectionNav onExport={() => setShowExportModal(true)} />
        </div>
        
        {/* Center - Section Form */}
        <div className="flex-1">
          <SectionForm sectionId={activeSectionId} />
        </div>
        
        {/* Right Side - Dictation Panel (only when needed) */}
        {audioRequired && (
          <DictationPanel 
            sectionTitle={sectionTitle}
            caseId={currentCase?.id} // Pass current case ID
            sectionId={activeSectionId}
          />
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />
      </div>
    </NavigationGuard>
  );
};
