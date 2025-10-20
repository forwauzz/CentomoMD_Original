import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, ChevronDown, Zap, Users } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { CNESST_SECTIONS } from '@/lib/constants';
// Schema-driven form utilities (for future use)

export interface SaveToSectionOption {
  sectionId: string;
  textBoxId: string;
  label: string;
  isRecommended?: boolean;
  isMultiSection?: boolean;
}

interface SaveToSectionDropdownProps {
  onSave: (option: SaveToSectionOption | SaveToSectionOption[]) => void;
  isSaving?: boolean;
  disabled?: boolean;
  appliedTemplate?: string | null;
  mode?: string;
  enableMultiSection?: boolean;
}

export const SaveToSectionDropdown: React.FC<SaveToSectionDropdownProps> = ({
  onSave,
  isSaving = false,
  disabled = false,
  appliedTemplate = null,
  mode = 'smart_dictation',
  enableMultiSection = false
}) => {
  const { t, language } = useI18n();
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedTextBox, setSelectedTextBox] = useState<string>('');
  const [selectedMultiSections, setSelectedMultiSections] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [saveMode, setSaveMode] = useState<'single' | 'multi'>('single');

  // Get template-based recommendations
  const getTemplateRecommendations = (template: string | null, mode: string): SaveToSectionOption[] => {
    const recommendations: SaveToSectionOption[] = [];
    
    if (template?.includes('section7') || template?.includes('section-7')) {
      recommendations.push({
        sectionId: 'section_7',
        textBoxId: 'finalText',
        label: 'Section 7 - Historique de faits et évolution (Recommandé)',
        isRecommended: true
      });
    }
    
    if (template?.includes('section8') || template?.includes('section-8')) {
      recommendations.push({
        sectionId: 'section_8',
        textBoxId: 'finalText',
        label: 'Section 8 - Questionnaire subjectif et état actuel (Recommandé)',
        isRecommended: true
      });
    }
    
    // For ambient mode, recommend both sections
    if (mode === 'ambient') {
      recommendations.push(
        {
          sectionId: 'section_7',
          textBoxId: 'finalText',
          label: 'Section 7 - Historique de faits et évolution',
          isRecommended: true,
          isMultiSection: true
        },
        {
          sectionId: 'section_8',
          textBoxId: 'finalText',
          label: 'Section 8 - Questionnaire subjectif et état actuel',
          isRecommended: true,
          isMultiSection: true
        }
      );
    }
    
    return recommendations;
  };

  // Define available save options with template recommendations
  const templateRecommendations = getTemplateRecommendations(appliedTemplate, mode);
  const saveOptions: SaveToSectionOption[] = [
    // Template recommendations first
    ...templateRecommendations,
    // Section 7 options
    {
      sectionId: 'section_7',
      textBoxId: 'finalText',
      label: 'Section 7 - Historique de faits et évolution'
    },
    {
      sectionId: 'section_7',
      textBoxId: 'rawTranscript',
      label: 'Section 7 - Transcription brute'
    },
    // Section 8 option
    {
      sectionId: 'section_8',
      textBoxId: 'finalText',
      label: 'Section 8 - Questionnaire subjectif et état actuel'
    },
    {
      sectionId: 'section_8',
      textBoxId: 'rawTranscript',
      label: 'Section 8 - Transcription brute'
    },
    // Other sections (generic)
    ...CNESST_SECTIONS
      .filter(section => !['section_7', 'section_8'].includes(section.id))
      .map(section => ({
        sectionId: section.id,
        textBoxId: 'finalText',
        label: `${section.id.replace('section_', 'Section ')} - Contenu`
      }))
  ];

  // Get text box options for selected section
  const textBoxOptions = saveOptions.filter(option => option.sectionId === selectedSection);

  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
    setSelectedTextBox(''); // Reset text box selection
  };

  const handleTextBoxChange = (textBoxId: string) => {
    setSelectedTextBox(textBoxId);
  };

  const handleSave = () => {
    if (saveMode === 'single' && selectedSection && selectedTextBox) {
      const option = saveOptions.find(
        opt => opt.sectionId === selectedSection && opt.textBoxId === selectedTextBox
      );
      if (option) {
        onSave(option);
        setIsOpen(false);
        // Reset selections
        setSelectedSection('');
        setSelectedTextBox('');
      }
    } else if (saveMode === 'multi' && selectedMultiSections.length > 0) {
      const options = selectedMultiSections.map(sectionId => {
        const option = saveOptions.find(opt => opt.sectionId === sectionId);
        return option || {
          sectionId,
          textBoxId: 'finalText',
          label: `${sectionId.replace('section_', 'Section ')} - Contenu`
        };
      });
      onSave(options);
      setIsOpen(false);
      // Reset selections
      setSelectedMultiSections([]);
    }
  };

  const handleMultiSectionToggle = (sectionId: string, checked: boolean) => {
    if (checked) {
      setSelectedMultiSections(prev => [...prev, sectionId]);
    } else {
      setSelectedMultiSections(prev => prev.filter(id => id !== sectionId));
    }
  };

  const canSave = saveMode === 'single' 
    ? (selectedSection && selectedTextBox && !isSaving)
    : (selectedMultiSections.length > 0 && !isSaving);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
        size="sm"
      >
        <Save className="h-4 w-4" />
        <span>{t('saveToSection')}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Card className="w-96">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Save className="h-4 w-4" />
          {t('saveToSection')}
          {appliedTemplate && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              Template: {appliedTemplate}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Save Mode Selection */}
        {enableMultiSection && (
          <div className="flex gap-2">
            <Button
              variant={saveMode === 'single' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSaveMode('single')}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-1" />
              Section unique
            </Button>
            <Button
              variant={saveMode === 'multi' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSaveMode('multi')}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-1" />
              Multi-sections
            </Button>
          </div>
        )}

        {/* Template Recommendations */}
        {templateRecommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Recommandations</span>
            </div>
            <div className="space-y-2">
              {templateRecommendations.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox
                    id={`rec-${index}`}
                    checked={saveMode === 'multi' ? selectedMultiSections.includes(option.sectionId) : false}
                    onCheckedChange={(checked) => {
                      if (saveMode === 'multi') {
                        handleMultiSectionToggle(option.sectionId, checked as boolean);
                      } else {
                        setSelectedSection(option.sectionId);
                        setSelectedTextBox(option.textBoxId);
                      }
                    }}
                  />
                  <label htmlFor={`rec-${index}`} className="text-sm text-blue-700 cursor-pointer">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single Section Mode */}
        {saveMode === 'single' && (
          <>
            {/* Section Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                {t('selectSection')}
              </label>
              <Select
                value={selectedSection || null}
                onValueChange={handleSectionChange}
                items={CNESST_SECTIONS.map(section => ({
                  value: section.id,
                  label: language === 'en' ? section.titleEn : section.title
                }))}
                className="w-full"
              />
            </div>

            {/* Text Box Selection */}
            {selectedSection && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {t('selectTextBox')}
                </label>
                <Select
                  value={selectedTextBox || null}
                  onValueChange={handleTextBoxChange}
                  items={textBoxOptions.map(option => ({
                    value: option.textBoxId,
                    label: option.label
                  }))}
                  className="w-full"
                />
              </div>
            )}
          </>
        )}

        {/* Multi-Section Mode */}
        {saveMode === 'multi' && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Sélectionner les sections
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {['section_7', 'section_8'].map(sectionId => {
                const section = CNESST_SECTIONS.find(s => s.id === sectionId);
                return (
                  <div key={sectionId} className="flex items-center gap-2">
                    <Checkbox
                      id={sectionId}
                      checked={selectedMultiSections.includes(sectionId)}
                      onCheckedChange={(checked) => handleMultiSectionToggle(sectionId, checked as boolean)}
                    />
                    <label htmlFor={sectionId} className="text-sm text-gray-700 cursor-pointer">
                      {section ? (language === 'en' ? section.titleEn : section.title) : sectionId}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1"
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 
             saveMode === 'multi' ? 
               `Save to ${selectedMultiSections.length} sections` : 
               t('saveToSelected')
            }
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
