import React, { useState } from 'react';
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
    icon: <FileText className="h-3 w-3" />,
  },
  {
    value: 'smart_dictation',
    label: 'Smart Dictation',
    icon: <Mic className="h-3 w-3" />,
  },
  {
    value: 'ambient',
    label: 'Transcribe (Ambient Listening)',
    icon: <Play className="h-3 w-3" />,
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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="select-trigger w-full justify-between px-2 py-1 h-7 text-[10px] font-medium bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400"
      >
        <div className="flex items-center space-x-1.5 flex-1 text-left min-w-0">
          {currentModeData?.icon && <span className="flex-shrink-0">{currentModeData.icon}</span>}
          <span className="truncate flex-1">{currentModeData?.label}</span>
        </div>
        <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-[100] overflow-y-auto" style={{ maxHeight: '200px' }}>
            {modes.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => handleModeSelect(mode.value)}
                className={`w-full px-2 py-2 text-left text-[10px] font-medium transition-colors flex items-center space-x-1.5 first:rounded-t-md last:rounded-b-md whitespace-nowrap ${
                  currentMode === mode.value
                    ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex-shrink-0">{mode.icon}</span>
                <span className="flex-1 min-w-0">{mode.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
