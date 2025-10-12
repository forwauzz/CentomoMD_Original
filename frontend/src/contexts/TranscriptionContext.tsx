/**
 * Global Transcription Context Provider
 * Provides transcription data to components throughout the app
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface TranscriptionContextData {
  currentTranscript: string;
  mode: string;
  inputLanguage: 'fr' | 'en';
  outputLanguage: 'fr' | 'en';
  templateName: string;
  diarization: boolean;
  customVocab: boolean;
  sessionId?: string;
  paragraphs: string[];
  segments: any[];
  orthopedicNarrative?: any;
}

interface TranscriptionContextType {
  transcriptionData: TranscriptionContextData | null;
  setTranscriptionData: (data: TranscriptionContextData | null) => void;
  clearTranscriptionData: () => void;
}

const TranscriptionContext = createContext<TranscriptionContextType | undefined>(undefined);

interface TranscriptionProviderProps {
  children: ReactNode;
}

export const TranscriptionProvider: React.FC<TranscriptionProviderProps> = ({ children }) => {
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionContextData | null>(null);

  const clearTranscriptionData = useCallback(() => {
    setTranscriptionData(null);
  }, []);

  return (
    <TranscriptionContext.Provider
      value={{
        transcriptionData,
        setTranscriptionData,
        clearTranscriptionData,
      }}
    >
      {children}
    </TranscriptionContext.Provider>
  );
};

export const useTranscriptionContext = (): TranscriptionContextType => {
  const context = useContext(TranscriptionContext);
  if (context === undefined) {
    throw new Error('useTranscriptionContext must be used within a TranscriptionProvider');
  }
  return context;
};
