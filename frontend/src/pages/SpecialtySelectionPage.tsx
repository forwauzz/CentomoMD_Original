import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Bone, ArrowRight, Stethoscope } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export const SpecialtySelectionPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSpecialtySelect = (specialty: 'orthopedics' | 'neuro') => {
    // Store specialty choice in localStorage
    localStorage.setItem('selectedSpecialty', specialty);
    
    // Navigate to appropriate dashboard
    if (specialty === 'orthopedics') {
      navigate(ROUTES.DASHBOARD);
    } else {
      navigate(ROUTES.NEURO_DASHBOARD);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-800">TecheMD</h1>
              <p className="text-slate-600 text-lg">Professional Medical Documentation</p>
            </div>
          </div>
          <h2 className="text-3xl font-semibold text-slate-700 mb-4">
            Choose Your Specialty
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Select your medical specialty to access the appropriate documentation tools and templates.
          </p>
        </div>

        {/* Specialty Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Orthopedics Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 cursor-pointer">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Bone className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-slate-800">Orthopedics</CardTitle>
              <CardDescription className="text-slate-600 text-base">
                Comprehensive orthopedic documentation with CNESST forms, templates, and voice dictation.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  CNESST Form Automation
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Voice-Powered Documentation
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Template Management
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Transcript Analysis
                </div>
              </div>
              <Button 
                onClick={() => handleSpecialtySelect('orthopedics')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white group-hover:shadow-lg transition-all"
              >
                Select Orthopedics
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Neuro Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200 cursor-pointer">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Brain className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-slate-800">Neuro</CardTitle>
              <CardDescription className="text-slate-600 text-base">
                Advanced neurological documentation with AI-powered analysis and streamlined workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  AI-Powered Analysis
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Streamlined Workflow
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Neuro Templates
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Voice Dictation
                </div>
              </div>
              <Button 
                onClick={() => handleSpecialtySelect('neuro')}
                className="w-full bg-green-600 hover:bg-green-700 text-white group-hover:shadow-lg transition-all"
              >
                Select Neuro
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-slate-500 text-sm">
            You can change your specialty selection at any time from the settings menu.
          </p>
        </div>
      </div>
    </div>
  );
};
