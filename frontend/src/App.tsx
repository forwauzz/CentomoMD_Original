import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { NewCasePage } from '@/pages/NewCasePage';
import { DictationPage } from '@/pages/DictationPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { TemplateManagement } from '@/pages/TemplateManagement';
import { LoginPage } from '@/pages/LoginPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { SelectClinicPage } from '@/pages/SelectClinicPage';
import { TranscriptionInterface } from '@/components/transcription/TranscriptionInterface';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Globe, LogOut, Mic, FileText, Home } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth and utility routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/select-clinic" element={<SelectClinicPage />} />
        
        {/* App layout with existing routes */}
        <Route path="/" element={<AppLayout />}>
          {/* Default route redirects to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard - TODO: Wrap with ProtectedRoute after verification */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* New Case - TODO: Wrap with ProtectedRoute after verification */}
          <Route path="/case/new" element={<NewCasePage />} />
          
          {/* Templates - PROTECTED */}
          <Route path="/templates" element={
            <ProtectedRoute>
              <TemplateManagement />
            </ProtectedRoute>
          } />
          
          {/* Dictation - PROTECTED */}
          <Route path="/dictation" element={
            <ProtectedRoute>
              <DictationPage />
            </ProtectedRoute>
          } />
          
          {/* Settings - TODO: Wrap with ProtectedRoute after verification */}
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* Profile - TODO: Wrap with ProtectedRoute after verification */}
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Legacy route for backward compatibility */}
          <Route path="/legacy" element={<LegacyApp />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Legacy App component for backward compatibility
function LegacyApp() {
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [currentPage, setCurrentPage] = useState<'dictation' | 'templates'>('dictation');
  const { language, setLanguage } = useUIStore();

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
          {currentPage === 'dictation' ? (
            <TranscriptionInterface
              sessionId={sessionId}
              onSessionUpdate={handleSessionUpdate}
              language={language}
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
