import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Mic, Play } from 'lucide-react';
import { TranscriptionMode } from '@/types';

interface ModeToggleProps {
  currentMode: TranscriptionMode;
  onModeChange: (mode: TranscriptionMode) => void;
  language?: 'fr' | 'en';
}

const modes: { value: TranscriptionMode; label: string; icon: React.ReactNode }[] = [
  {
    value: 'word_for_word',
    label: 'Word for Word',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    value: 'smart_dictation',
    label: 'Smart Dictation',
    icon: <Mic className="h-4 w-4" />,
  },
  {
    value: 'ambient',
    label: 'Transcribe (Ambient Listening)',
    icon: <Play className="h-4 w-4" />,
  },
];

export const ModeToggle: React.FC<ModeToggleProps> = ({
  currentMode,
  onModeChange
}) => {
  return (
    <div className="flex flex-col gap-2">
      {modes.map((mode) => (
        <Button
          key={mode.value}
          variant={currentMode === mode.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange(mode.value)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all justify-start ${
            currentMode === mode.value
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            {mode.icon}
            <span>{mode.label}</span>
          </div>
        </Button>
      ))}
    </div>
  );
};
