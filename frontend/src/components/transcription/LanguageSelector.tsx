import React from 'react';
import { Select } from '@/components/ui/select';

interface InputLanguageSelectorProps {
  language: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
}

export const InputLanguageSelector: React.FC<InputLanguageSelectorProps> = ({
  language,
  onLanguageChange,
  disabled = false
}) => {
  const handleLanguageChange = (newLanguage: string) => {
    console.log('InputLanguageSelector: input language changed from', language, 'to', newLanguage);
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
