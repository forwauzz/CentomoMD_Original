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
  const handleLanguageChange = (newLanguage: string) => {
    console.log('LanguageSelector: language changed to:', newLanguage);
    onLanguageChange(newLanguage);
  };

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
            {getLanguageDisplay(language)}
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
