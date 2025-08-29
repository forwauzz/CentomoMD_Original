import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/lib/utils';

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
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium">
        {t('language', 'fr')}:
      </label>
      <Select
        value={language}
        onValueChange={onLanguageChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('selectLanguage', 'fr')} />
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
