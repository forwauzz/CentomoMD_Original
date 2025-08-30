import React from 'react';
import { Select } from '@/components/ui/select';
import { CNESSTSection } from '@/types';

interface SectionSelectorProps {
  currentSection: CNESSTSection;
  onSectionChange: (section: CNESSTSection) => void;
}

export const SectionSelector: React.FC<SectionSelectorProps> = ({
  currentSection,
  onSectionChange
}) => {
  const handleSectionChange = (newSection: string) => {
    console.log('SectionSelector: section changed from', currentSection, 'to', newSection);
    onSectionChange(newSection as CNESSTSection);
  };

  const sectionItems = [
    { label: "Section 7", value: "section_7" },
    { label: "Section 8", value: "section_8" },
    { label: "Section 11", value: "section_11" },
  ];

  return (
    <Select
      value={currentSection}
      onValueChange={handleSectionChange}
      items={sectionItems}
      buttonClassName="w-full bg-white border border-gray-300 rounded-md text-left"
    />
  );
};
