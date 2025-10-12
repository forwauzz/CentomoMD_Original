import React from 'react';
import { Select } from '@/components/ui/select';

interface OutputLanguageSelectorProps {
  language: 'fr' | 'en';
  onLanguageChange: (language: 'fr' | 'en') => void;
  disabled?: boolean;
  showWarning?: boolean;
}

export const OutputLanguageSelector: React.FC<OutputLanguageSelectorProps> = ({
  language,
  onLanguageChange,
  disabled = false,
  showWarning = false
}) => {
  const handleLanguageChange = (newLanguage: string) => {
    console.log('OutputLanguageSelector: output language changed from', language, 'to', newLanguage);
    onLanguageChange(newLanguage as 'fr' | 'en');
  };

  const languageItems = [
    { label: "Français (CNESST)", value: "fr" },
    { label: "English (Non-CNESST)", value: "en" },
  ];

  return (
    <div className="space-y-2">
      <Select
        value={language}
        onValueChange={handleLanguageChange}
        disabled={disabled}
        items={languageItems}
        buttonClassName="w-full bg-white border border-gray-300 rounded-md text-left"
      />
      {showWarning && language === 'en' && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800">
            ⚠️ English output may not be CNESST compliant for sections 7, 8, and 11
          </p>
        </div>
      )}
    </div>
  );
};
