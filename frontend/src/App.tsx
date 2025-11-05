import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { NewCasePage } from '@/pages/NewCasePage';
import { DictationPage } from '@/pages/DictationPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { TemplateManagement } from '@/pages/TemplateManagement';
import { TemplateCombinationManagement } from '@/pages/TemplateCombinationManagement';
import { VoiceCommandsPage } from '@/pages/VoiceCommandsPage';
import { VerbatimPage } from '@/pages/VerbatimPage';
import { MacrosPage } from '@/pages/MacrosPage';
import { TranscriptAnalysisPage } from '@/pages/TranscriptAnalysisPage';
import { LoginPage } from '@/pages/LoginPage';
import { AuthCallback } from '@/pages/AuthCallback';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { SelectClinicPage } from '@/pages/SelectClinicPage';
import { TranscriptionInterface } from '@/components/transcription/TranscriptionInterface';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Globe, LogOut, Mic, FileText, Home } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useFeatureFlags } from '@/lib/featureFlags';
import { TemplateProvider } from '@/contexts/TemplateContext';
import { TranscriptionProvider } from '@/contexts/TranscriptionContext';
import { LandingPage } from '@/pages/LandingPage';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { TermsOfService } from '@/pages/TermsOfService';
import { SecurityPolicy } from '@/pages/SecurityPolicy';

function App() {
  const featureFlags = useFeatureFlags();

  return (
    <TemplateProvider>
      <TranscriptionProvider>
        <BrowserRouter>
      <Routes>
        {/* Optional public landing page (feature-flagged) */}
        {featureFlags.landingPage && (
          <Route path="/" element={<LandingPage />} />
        )}
        {/* Auth and utility routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/select-clinic" element={<SelectClinicPage />} />
        
        {/* Legal pages */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/security-policy" element={<SecurityPolicy />} />
        
        {/* App layout with existing routes */}
        <Route path="/" element={<AppLayout />}>
          {/* Default route redirects to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard - PROTECTED */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          {/* New Case - PROTECTED */}
          <Route path="/case/new" element={
            <ProtectedRoute>
              <NewCasePage />
            </ProtectedRoute>
          } />
          
          {/* Templates - PROTECTED */}
          <Route path="/templates" element={
            <ProtectedRoute>
              <TemplateManagement />
            </ProtectedRoute>
          } />
          
          {/* Template Combinations - PROTECTED */}
          <Route path="/template-combinations" element={
            <ProtectedRoute>
              <TemplateCombinationManagement />
            </ProtectedRoute>
          } />
          
          {/* Dictation - PROTECTED */}
          <Route path="/dictation" element={
            <ProtectedRoute>
              <DictationPage />
            </ProtectedRoute>
          } />
          
          {/* Voice Commands - Feature Flagged */}
          {featureFlags.voiceCommands && (
            <Route path="/voice-commands" element={
              <ProtectedRoute>
                <VoiceCommandsPage />
              </ProtectedRoute>
            } />
          )}
          
          {/* Verbatim - Feature Flagged */}
          {featureFlags.verbatim && (
            <Route path="/verbatim" element={
              <ProtectedRoute>
                <VerbatimPage />
              </ProtectedRoute>
            } />
          )}
          
          {/* Macros - Feature Flagged */}
          {featureFlags.macros && (
            <Route path="/macros" element={
              <ProtectedRoute>
                <MacrosPage />
              </ProtectedRoute>
            } />
          )}
          
          {/* Transcript Analysis */}
          <Route path="/transcript-analysis" element={
            <ProtectedRoute>
              <TranscriptAnalysisPage />
            </ProtectedRoute>
          } />
          
          {/* Settings - PROTECTED */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          
          {/* Profile - PROTECTED */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          {/* Legacy route for backward compatibility */}
          <Route path="/legacy" element={<LegacyApp />} />
        </Route>
        </Routes>
        </BrowserRouter>
      </TranscriptionProvider>
    </TemplateProvider>
  );
}

// Legacy App component for backward compatibility
function LegacyApp() {
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [currentPage, setCurrentPage] = useState<'dictation' | 'templates'>('dictation');
  const { inputLanguage, setInputLanguage } = useUIStore();

  const handleSessionUpdate = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  const toggleLanguage = () => {
    setInputLanguage(inputLanguage === 'fr' ? 'en' : 'fr');
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
            
            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <Button
                variant={currentPage === 'dictation' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentPage('dictation')}
                className="text-white hover:bg-blue-800 flex items-center space-x-1"
              >
                <Home className="h-4 w-4" />
                <span>Dictation</span>
              </Button>
              <Button
                variant={currentPage === 'templates' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentPage('templates')}
                className="text-white hover:bg-blue-800 flex items-center space-x-1"
              >
                <FileText className="h-4 w-4" />
                <span>Templates</span>
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="text-white hover:bg-blue-800 flex items-center space-x-1"
              >
                <Globe className="h-4 w-4" />
                <span>{inputLanguage.toUpperCase()}</span>
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
          {currentPage === 'dictation' ? (
            <TranscriptionInterface
              sessionId={sessionId}
              onSessionUpdate={handleSessionUpdate}
              language={inputLanguage}
            />
          ) : (
            <TemplateManagement />
          )}
        </div>
      </main>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-200 border-t border-gray-300 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Input Language: {inputLanguage === 'en' ? 'English' : 'Français'}</span>
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
