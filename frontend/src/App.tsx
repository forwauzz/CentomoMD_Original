import React, { useState } from 'react';
import { TranscriptionInterface } from '@/components/transcription/TranscriptionInterface';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Globe, Shield, Activity, Mic, Brain } from 'lucide-react';
import { t } from '@/lib/utils';

function App() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [showSettings, setShowSettings] = useState(false);

  const handleSessionUpdate = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-medical-primary" />
                <div>
                  <h1 className="text-2xl font-bold">CentomoMD</h1>
                  <p className="text-sm text-muted-foreground">
                    {t('medicalDocumentation', language)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="medical" className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>{t('hipaaCompliant', language)}</span>
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className="flex items-center space-x-1"
              >
                <Globe className="h-4 w-4" />
                <span>{language.toUpperCase()}</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-1"
              >
                <Settings className="h-4 w-4" />
                <span>{t('settings', language)}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Card */}
          {!sessionId && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-6 w-6 text-medical-primary" />
                  <span>{t('welcomeToCentomoMD', language)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-medical-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Mic className="h-6 w-6 text-medical-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{t('realTimeTranscription', language)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('realTimeTranscriptionDesc', language)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-medical-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Brain className="h-6 w-6 text-medical-secondary" />
                    </div>
                    <h3 className="font-semibold mb-2">{t('aiFormatting', language)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('aiFormattingDesc', language)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-medical-warning/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Shield className="h-6 w-6 text-medical-warning" />
                    </div>
                    <h3 className="font-semibold mb-2">{t('compliance', language)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('complianceDesc', language)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transcription Interface */}
          <TranscriptionInterface
            sessionId={sessionId}
            onSessionUpdate={handleSessionUpdate}
            language={language}
          />

          {/* Settings Panel */}
          {showSettings && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>{t('settings', language)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">{t('language', language)}</label>
                    <div className="mt-2">
                      <Button
                        variant={language === 'fr' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLanguage('fr')}
                        className="mr-2"
                      >
                        Français
                      </Button>
                      <Button
                        variant={language === 'en' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLanguage('en')}
                      >
                        English
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">{t('compliance', language)}</label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="success">HIPAA</Badge>
                        <Badge variant="success">PIPEDA</Badge>
                        <Badge variant="success">Law 25</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('complianceInfo', language)}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">{t('region', language)}</label>
                    <div className="mt-2">
                      <Badge variant="info">ca-central-1 (Montreal)</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('regionInfo', language)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                © 2024 CentomoMD. {t('allRightsReserved', language)}.
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">{t('version', language)} 1.0.0</Badge>
              <Badge variant="outline">{t('beta', language)}</Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
