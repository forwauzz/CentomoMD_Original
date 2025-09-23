import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Mic, Brain, ArrowRight, Sparkles } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useSpecialty } from '@/contexts/SpecialtyContext';

export const NeuroDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isNeuro } = useSpecialty();

  // Redirect if not Neuro specialty
  if (!isNeuro) {
    navigate(ROUTES.SPECIALTY_SELECTION);
    return null;
  }

  const handleNewCase = () => {
    navigate(ROUTES.NEW_CASE);
  };

  const handleStartDictation = () => {
    navigate(ROUTES.DICTATION);
  };

  return (
    <div className="neuro-dashboard min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-neuro-background to-neuro-surface border-b border-neuro-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-neuro-primary to-neuro-secondary rounded-xl flex items-center justify-center neuro-glow">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neuro-text neuro-text-glow">
                  Neuro Dashboard
                </h1>
                <p className="text-neuro-text-secondary text-lg">
                  AI-Powered Neurological Documentation
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neuro-text-secondary">
              <Sparkles className="w-4 h-4 text-neuro-primary" />
              <span>Advanced AI Analysis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="neuro-card p-6 rounded-2xl">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-neuro-primary/20 to-neuro-secondary/20 rounded-2xl flex items-center justify-center">
                <Brain className="w-8 h-8 text-neuro-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-neuro-text mb-2">
                  Welcome to Neuro Mode
                </h2>
                <p className="text-neuro-text-secondary">
                  Streamlined neurological documentation with AI-powered analysis and advanced transcription capabilities.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Start New Case Card */}
          <div className="neuro-dashboard-card p-8 group cursor-pointer" onClick={handleNewCase}>
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-neuro-primary to-neuro-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 neuro-glow group-hover:animate-glow">
                <Plus className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-neuro-text mb-2">
                Start New Case
              </CardTitle>
              <CardDescription className="text-neuro-text-secondary text-base">
                Create a new neurological case with AI-assisted documentation and analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-neuro-text-secondary">
                  <div className="w-2 h-2 bg-neuro-primary rounded-full mr-3"></div>
                  AI-Powered Case Analysis
                </div>
                <div className="flex items-center text-sm text-neuro-text-secondary">
                  <div className="w-2 h-2 bg-neuro-primary rounded-full mr-3"></div>
                  Neurological Templates
                </div>
                <div className="flex items-center text-sm text-neuro-text-secondary">
                  <div className="w-2 h-2 bg-neuro-primary rounded-full mr-3"></div>
                  Smart Documentation
                </div>
              </div>
              <Button 
                className="neuro-button w-full group-hover:animate-glow"
                size="lg"
              >
                Create New Case
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </div>

          {/* Start Dictation Card */}
          <div className="neuro-dashboard-card p-8 group cursor-pointer" onClick={handleStartDictation}>
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-neuro-accent to-neuro-primary rounded-2xl flex items-center justify-center mx-auto mb-4 neuro-glow group-hover:animate-glow">
                <Mic className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-neuro-text mb-2">
                Start Dictation
              </CardTitle>
              <CardDescription className="text-neuro-text-secondary text-base">
                Begin voice-powered documentation with real-time AI transcription and analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-neuro-text-secondary">
                  <div className="w-2 h-2 bg-neuro-accent rounded-full mr-3"></div>
                  Real-Time Transcription
                </div>
                <div className="flex items-center text-sm text-neuro-text-secondary">
                  <div className="w-2 h-2 bg-neuro-accent rounded-full mr-3"></div>
                  AI Voice Analysis
                </div>
                <div className="flex items-center text-sm text-neuro-text-secondary">
                  <div className="w-2 h-2 bg-neuro-accent rounded-full mr-3"></div>
                  Smart Formatting
                </div>
              </div>
              <Button 
                className="neuro-button w-full group-hover:animate-glow"
                size="lg"
                variant="outline"
              >
                Start Dictation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12">
          <div className="neuro-card p-8 rounded-2xl">
            <h3 className="text-xl font-semibold text-neuro-text mb-6 text-center">
              Neuro Mode Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-neuro-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-6 h-6 text-neuro-primary" />
                </div>
                <h4 className="font-medium text-neuro-text mb-2">AI Analysis</h4>
                <p className="text-sm text-neuro-text-secondary">
                  Advanced neurological pattern recognition and analysis
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-neuro-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Mic className="w-6 h-6 text-neuro-primary" />
                </div>
                <h4 className="font-medium text-neuro-text mb-2">Voice Dictation</h4>
                <p className="text-sm text-neuro-text-secondary">
                  Real-time transcription with neurological terminology
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-neuro-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-neuro-primary" />
                </div>
                <h4 className="font-medium text-neuro-text mb-2">Smart Templates</h4>
                <p className="text-sm text-neuro-text-secondary">
                  Specialized neurological documentation templates
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
