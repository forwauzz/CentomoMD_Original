import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/lib/utils';

interface LanguageSelectorProps {
  language: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
}

const getLanguageDisplay = (languageCode: string) => {
  switch (languageCode) {
    case 'fr-CA':
      return '🇨🇦 Français (Canada)';
    case 'en-US':
      return '🇺🇸 English (US)';
    default:
      return '🇨🇦 Français (Canada)';
  }
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language,
  onLanguageChange,
  disabled = false
}) => {
  console.log('LanguageSelector: rendering with language:', language, 'disabled:', disabled);
  console.log('LanguageSelector: onLanguageChange function exists:', !!onLanguageChange);
  
  const handleLanguageChange = (newLanguage: string) => {
    console.log('LanguageSelector: language changed to:', newLanguage);
    onLanguageChange(newLanguage);
  };

  const displayText = getLanguageDisplay(language);
  console.log('LanguageSelector: displayText:', displayText);

  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium">
        {t('language', 'fr')}:
      </label>
      <Select
        value={language}
        onValueChange={handleLanguageChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            {displayText}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fr-CA">
            🇨🇦 Français (Canada)
          </SelectItem>
          <SelectItem value="en-US">
            🇺🇸 English (US)
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
