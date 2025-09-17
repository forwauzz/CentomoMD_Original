import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Save, ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { CNESST_SECTIONS } from '@/lib/constants';

export interface SaveToSectionOption {
  sectionId: string;
  textBoxId: string;
  label: string;
}

interface SaveToSectionDropdownProps {
  onSave: (option: SaveToSectionOption) => void;
  isSaving?: boolean;
  disabled?: boolean;
}

export const SaveToSectionDropdown: React.FC<SaveToSectionDropdownProps> = ({
  onSave,
  isSaving = false,
  disabled = false
}) => {
  const { t, language } = useI18n();
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedTextBox, setSelectedTextBox] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // Define available save options
  const saveOptions: SaveToSectionOption[] = [
    // Section 7 options
    {
      sectionId: 'section_7',
      textBoxId: 'mainContent',
      label: t('section7Main')
    },
    {
      sectionId: 'section_7',
      textBoxId: 'patientVerbatim',
      label: t('section7Patient')
    },
    {
      sectionId: 'section_7',
      textBoxId: 'radiologistVerbatim',
      label: t('section7Radiologist')
    },
    // Section 8 option
    {
      sectionId: 'section_8',
      textBoxId: 'section8Content',
      label: t('section8Content')
    },
    // Other sections (generic)
    ...CNESST_SECTIONS
      .filter(section => !['section_7', 'section_8'].includes(section.id))
      .map(section => ({
        sectionId: section.id,
        textBoxId: 'observations',
        label: `${section.id.replace('section_', 'Section ')} - ${t('otherSections')}`
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
    if (selectedSection && selectedTextBox) {
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
    }
  };

  const canSave = selectedSection && selectedTextBox && !isSaving;

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
    <Card className="w-80">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{t('saveToSection')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1"
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : t('saveToSelected')}
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
