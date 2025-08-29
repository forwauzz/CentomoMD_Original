import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t } from '@/lib/utils';
import { CNESSTSection } from '@/types';

interface SectionSelectorProps {
  currentSection: CNESSTSection;
  onSectionChange: (section: CNESSTSection) => void;
  language?: 'fr' | 'en';
}

const sections: { value: CNESSTSection; label: string; description: string; color: string }[] = [
  {
    value: 'section_7',
    label: 'Section 7',
    description: 'Historique de faits et évolution',
    color: 'medical-primary',
  },
  {
    value: 'section_8',
    label: 'Section 8',
    description: 'Questionnaire subjectif',
    color: 'medical-secondary',
  },
  {
    value: 'section_11',
    label: 'Section 11',
    description: 'Conclusion médicale',
    color: 'medical-warning',
  },
];

export const SectionSelector: React.FC<SectionSelectorProps> = ({
  currentSection,
  onSectionChange,
  language = 'fr'
}) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">{t('section', language)}:</span>
      <div className="flex space-x-1">
        {sections.map((section) => (
          <Button
            key={section.value}
            variant={currentSection === section.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSectionChange(section.value)}
            className={`text-xs ${
              currentSection === section.value
                ? 'bg-medical-primary text-white border-medical-primary'
                : 'hover:bg-medical-primary/10'
            }`}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{section.label}</span>
              <span className="text-xs opacity-80">{t(section.value, language)}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};
