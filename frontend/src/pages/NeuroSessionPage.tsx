import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Save, 
  Brain, 
  User, 
  FileText,
  ArrowLeft,
  Play
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useSpecialty } from '@/contexts/SpecialtyContext';

export const NeuroSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { isNeuro, setSpecialty } = useSpecialty();
  const [patientId, setPatientId] = useState('');
  const [sessionContent, setSessionContent] = useState('');

  // If accessing neuro-session directly, set specialty to neuro
  React.useEffect(() => {
    if (!isNeuro) {
      setSpecialty('neuro');
    }
  }, [isNeuro, setSpecialty]);

  const handleStartDictation = () => {
    // Store current session data in localStorage for when user returns
    localStorage.setItem('neuroSessionData', JSON.stringify({
      patientId,
      sessionContent,
      timestamp: new Date().toISOString()
    }));
    
    // Navigate to dictation page
    navigate(ROUTES.DICTATION);
  };

  const handleSaveSession = () => {
    // Save session data
    const sessionData = {
      patientId,
      sessionContent,
      timestamp: new Date().toISOString(),
      saved: true
    };
    
    localStorage.setItem('neuroSessionData', JSON.stringify(sessionData));
    
    // Show success message (you could add a toast notification here)
    alert('Session saved successfully!');
  };

  const handleBackToDashboard = () => {
    navigate(ROUTES.NEURO_DASHBOARD);
  };

  // Load existing session data if available
  React.useEffect(() => {
    const savedData = localStorage.getItem('neuroSessionData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setPatientId(parsed.patientId || '');
        setSessionContent(parsed.sessionContent || '');
      } catch (error) {
        console.error('Error loading session data:', error);
      }
    }
  }, []);

  // Check for dictation results when component mounts
  React.useEffect(() => {
    const checkForDictationResults = () => {
      const dictationResults = localStorage.getItem('neuroDictationResults');
      if (dictationResults) {
        try {
          const results = JSON.parse(dictationResults);
          if (results.formattedContent) {
            // Append the formatted content to existing session content
            setSessionContent(prev => {
              const separator = prev.trim() ? '\n\n---\n\n' : '';
              return prev + separator + results.formattedContent;
            });
            
            // Clear the dictation results
            localStorage.removeItem('neuroDictationResults');
            
            // Show success message
            alert('Dictation content has been added to your session!');
          }
        } catch (error) {
          console.error('Error processing dictation results:', error);
        }
      }
    };

    checkForDictationResults();
  }, []);

  return (
    <div className="neuro-dashboard min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-neuro-background to-neuro-surface border-b border-neuro-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToDashboard}
                className="neuro-button text-neuro-text hover:bg-neuro-surface"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="w-10 h-10 bg-gradient-to-br from-neuro-primary to-neuro-secondary rounded-xl flex items-center justify-center neuro-glow">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neuro-text neuro-text-glow">
                  New Neuro Session
                </h1>
                <p className="text-neuro-text-secondary">
                  Create and manage neurological documentation sessions
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neuro-text-secondary">
              <Brain className="w-4 h-4 text-neuro-primary" />
              <span>AI-Powered Session</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Patient Information Sidebar */}
          <div className="lg:col-span-1">
            <Card className="neuro-card h-full">
              <CardHeader>
                <CardTitle className="text-neuro-text flex items-center">
                  <User className="w-5 h-5 mr-2 text-neuro-primary" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="patientId" className="text-neuro-text-secondary">
                    Patient Identifier
                  </Label>
                  <Input
                    id="patientId"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    placeholder="Enter patient ID or name"
                    className="neuro-border-glow mt-1"
                  />
                </div>
                <div className="text-xs text-neuro-text-secondary">
                  <p>Session will be associated with this patient identifier for easy reference and organization.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Session Area */}
          <div className="lg:col-span-3">
            <Card className="neuro-card h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-neuro-text flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-neuro-primary" />
                  Session Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Giant Text Area */}
                <div className="flex-1 mb-6">
                  <Textarea
                    value={sessionContent}
                    onChange={(e) => setSessionContent(e.target.value)}
                    placeholder="Start documenting your neurological findings here... 

You can:
• Type directly into this text area
• Use the 'Start Dictating' button for voice input
• Apply templates after dictation
• Save your progress at any time"
                    className="neuro-border-glow h-full resize-none text-base leading-relaxed"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-neuro-border">
                  <Button
                    onClick={handleSaveSession}
                    variant="outline"
                    className="neuro-button"
                    disabled={!sessionContent.trim()}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Session
                  </Button>
                  
                  <Button
                    onClick={handleStartDictation}
                    className="neuro-button bg-gradient-to-r from-neuro-primary to-neuro-secondary hover:from-neuro-secondary hover:to-neuro-primary"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Dictating
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Session Status */}
        <div className="mt-6">
          <Card className="neuro-card">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-neuro-primary rounded-full animate-pulse"></div>
                    <span className="text-sm text-neuro-text-secondary">Session Active</span>
                  </div>
                  {patientId && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-neuro-primary" />
                      <span className="text-sm text-neuro-text-secondary">
                        Patient: {patientId}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-neuro-text-secondary">
                  Auto-saved: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
