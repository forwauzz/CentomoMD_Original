import React from 'react';
import { Select, SelectItem } from '@/components/ui/select';
import { TranscriptionMode } from '@/types';

interface ModeToggleProps {
  currentMode: TranscriptionMode;
  onModeChange: (mode: TranscriptionMode) => void;
  language?: 'fr' | 'en';
}

const modes: SelectItem<TranscriptionMode>[] = [
  {
    value: 'word_for_word',
    label: 'Word for Word',
  },
  {
    value: 'smart_dictation',
    label: 'Smart Dictation',
  },
  {
    value: 'ambient',
    label: 'Transcribe (Ambient Listening)',
  },
];

export const ModeToggle: React.FC<ModeToggleProps> = ({
  currentMode,
  onModeChange
}) => {
  return (
    <div className="w-full">
      <Select
        value={currentMode}
        onValueChange={onModeChange}
        items={modes}
        className="w-full"
        buttonClassName="w-full p-3 text-left border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        menuClassName="w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10"
      />
    </div>
  );
};
