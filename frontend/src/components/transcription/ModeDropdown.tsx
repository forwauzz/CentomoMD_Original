import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Mic, Play, ChevronDown } from 'lucide-react';
import { TranscriptionMode } from '@/types';

interface ModeDropdownProps {
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

export const ModeDropdown: React.FC<ModeDropdownProps> = ({
  currentMode,
  onModeChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentModeData = modes.find(mode => mode.value === currentMode);

  const handleModeSelect = (mode: TranscriptionMode) => {
    onModeChange(mode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between px-3 py-2 h-9 text-sm font-medium bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400"
      >
        <div className="flex items-center space-x-2">
          {currentModeData?.icon}
          <span>{currentModeData?.label}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            {modes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleModeSelect(mode.value)}
                className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors flex items-center space-x-2 first:rounded-t-md last:rounded-b-md ${
                  currentMode === mode.value
                    ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
