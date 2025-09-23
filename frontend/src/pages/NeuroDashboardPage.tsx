import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Brain, ArrowRight, FileText } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useSpecialty } from '@/contexts/SpecialtyContext';

export const NeuroDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isNeuro, setSpecialty } = useSpecialty();

  // If accessing neuro-dashboard directly, set specialty to neuro
  React.useEffect(() => {
    if (!isNeuro) {
      setSpecialty('neuro');
    }
  }, [isNeuro, setSpecialty]);

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
              <Brain className="w-4 h-4 text-neuro-primary" />
              <span>AI-Powered Analysis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* New Session Card */}
          <div className="neuro-dashboard-card p-8 group cursor-pointer" onClick={() => navigate(ROUTES.NEURO_SESSION)}>
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-neuro-primary to-neuro-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 neuro-glow group-hover:animate-glow">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-neuro-text mb-2">
                New Session
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                className="neuro-button w-full group-hover:animate-glow"
                size="lg"
              >
                Create Session
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
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                className="neuro-button w-full group-hover:animate-glow"
                size="lg"
              >
                Start Dictation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </div>
        </div>
      </div>
    </div>
  );
};
