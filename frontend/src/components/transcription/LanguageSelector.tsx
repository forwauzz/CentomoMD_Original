import React from 'react';
import { Select } from '@/components/ui/select';

interface LanguageSelectorProps {
  language: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language,
  onLanguageChange,
  disabled = false
}) => {
  const handleLanguageChange = (newLanguage: string) => {
    console.log('LanguageSelector: language changed from', language, 'to', newLanguage);
    onLanguageChange(newLanguage);
  };

  const languageItems = [
    { label: "English", value: "en-US" },
    { label: "Français", value: "fr-CA" },
  ];

  return (
    <Select
      value={language}
      onValueChange={handleLanguageChange}
      disabled={disabled}
      items={languageItems}
      buttonClassName="w-full bg-white border border-gray-300 rounded-md text-left"
    />
  );
};
