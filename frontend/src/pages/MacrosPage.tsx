import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Plus, 
  Clock,
  AlertCircle
} from 'lucide-react';
// import { useI18n } from '@/lib/i18n'; // TODO: Implement i18n when needed

export const MacrosPage: React.FC = () => {
  // const { t } = useI18n(); // TODO: Implement i18n when needed

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-700">Macros</h1>
          <p className="text-gray-600 mt-1">
            Create and manage text expansion macros
          </p>
        </div>
        <Button
          disabled
          className="bg-gray-400 cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Macro
        </Button>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <Zap className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">Macros Coming Soon</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            The macros feature is currently under development. This will allow you to create 
            text expansion shortcuts for frequently used phrases and templates.
          </p>
          
          {/* Feature Preview */}
          <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-gray-700">Planned Features</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <h5 className="font-medium text-gray-700">Text Expansion</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Shortcut → Full text replacement</li>
                  <li>• Custom abbreviations</li>
                  <li>• Medical terminology shortcuts</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-gray-700">Smart Templates</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Dynamic placeholders</li>
                  <li>• Date/time insertion</li>
                  <li>• Patient data integration</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Expected release: Q1 2025</span>
          </div>
        </CardContent>
      </Card>

      {/* Example Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Example Usage (Preview)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Text Expansion</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded border">tcc</code>
                  <span>→</span>
                  <span>trauma crânio-cérébral</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded border">pt</code>
                  <span>→</span>
                  <span>physiothérapie</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded border">date</code>
                  <span>→</span>
                  <span>le {new Date().toLocaleDateString('fr-CA')}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Template Macros</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded border">consult</code>
                  <span>→</span>
                  <span>Le travailleur consulte le docteur [nom], le [date].</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded border">diagnosis</code>
                  <span>→</span>
                  <span>Il/Elle diagnostique [diagnostic] et prescrit [traitement].</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
