import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Mic, Brain, Radio } from 'lucide-react';
import { t } from '@/lib/utils';
import { TranscriptionMode } from '@/types';

interface ModeToggleProps {
  currentMode: TranscriptionMode;
  onModeChange: (mode: TranscriptionMode) => void;
  language?: 'fr' | 'en';
}

const modes: { value: TranscriptionMode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'word_for_word',
    label: 'Word-for-Word',
    description: 'Raw live speech-to-text',
    icon: <Mic className="h-4 w-4" />,
  },
  {
    value: 'smart_dictation',
    label: 'Smart Dictation',
    description: 'AI-assisted, medical structured',
    icon: <Brain className="h-4 w-4" />,
  },
  {
    value: 'ambient',
    label: 'Ambient',
    description: 'Long-form capture, diarized',
    icon: <Radio className="h-4 w-4" />,
  },
];

export const ModeToggle: React.FC<ModeToggleProps> = ({
  currentMode,
  onModeChange,
  language = 'fr'
}) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">{t('mode', language)}:</span>
      <div className="flex space-x-1">
        {modes.map((mode) => (
          <Button
            key={mode.value}
            variant={currentMode === mode.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onModeChange(mode.value)}
            className={`text-xs ${
              currentMode === mode.value
                ? 'bg-medical-secondary text-white border-medical-secondary'
                : 'hover:bg-medical-secondary/10'
            }`}
          >
            <div className="flex items-center space-x-1">
              {mode.icon}
              <div className="flex flex-col items-start">
                <span className="font-medium">{t(mode.value, language)}</span>
                <span className="text-xs opacity-80">{mode.description}</span>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};
