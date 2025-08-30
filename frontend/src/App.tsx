import { useState } from 'react';
import { TranscriptionInterface } from '@/components/transcription/TranscriptionInterface';
import { Button } from '@/components/ui/button';
import { Settings, Globe, LogOut, Mic } from 'lucide-react';

function App() {
  const [language, setLanguage] = useState<'fr' | 'en'>('en');
  const [sessionId, setSessionId] = useState<string | undefined>();

  const handleSessionUpdate = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Dark Blue */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mic className="h-8 w-8" />
              <h1 className="text-2xl font-bold">CentomoMD</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="text-white hover:bg-blue-800 flex items-center space-x-1"
              >
                <Globe className="h-4 w-4" />
                <span>{language.toUpperCase()}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-800 flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Transcription Interface */}
          <TranscriptionInterface
            sessionId={sessionId}
            onSessionUpdate={handleSessionUpdate}
            language={language}
          />
        </div>
      </main>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-200 border-t border-gray-300 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Language: {language === 'en' ? 'English' : 'Français'}</span>
            <span>Section: Not selected</span>
            <span>Mode: Not selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Ready for dictation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
