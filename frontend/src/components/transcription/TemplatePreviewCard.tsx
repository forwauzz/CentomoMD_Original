import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  // Zap,
  // Clock,
  // Tag,
  X
} from 'lucide-react';
import { TemplateJSON } from './TemplateDropdown';
import { FormattingService, FormattingOptions } from '@/services/formattingService';

// Function to render formatted content with styled headers
const renderFormattedContentWithStyledHeaders = (content: string) => {
  // Split content into lines
  const lines = content.split('\n');
  
  return (
    <div className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
      {lines.map((line, index) => {
        // Check if this line is a Section 8 header
        const isHeader = line.match(/^(Appréciation subjective de l'évolution|Plaintes et problèmes|Impact fonctionnel|Observations neurologiques|Autres observations|Exclusions \/ mentions négatives|Références externes)\s*:/);
        
        if (isHeader) {
          return (
            <div key={index} className="text-sm font-semibold text-gray-900 mb-1 mt-2 first:mt-0">
              {line}
            </div>
          );
        }
        
        return (
          <div key={index} className="mb-0.5">
            {line}
          </div>
        );
      })}
    </div>
  );
};

interface TemplatePreviewCardProps {
  template: TemplateJSON;
  onClose: () => void;
  onSelect: (template: TemplateJSON) => void;
  currentSection: "7" | "8" | "11";
  currentLanguage: "fr" | "en";
}

export const TemplatePreviewCard: React.FC<TemplatePreviewCardProps> = ({
  template,
  onClose,
  onSelect,
  // currentSection,
  currentLanguage
}) => {
  const [showFormatted, setShowFormatted] = useState(false);
  const [formattedContent, setFormattedContent] = useState<string>('');
  const [formattingChanges, setFormattingChanges] = useState<string[]>([]);
  const [compliance, setCompliance] = useState({
    cnesst: false,
    medical_terms: false,
    structure: false
  });
  const [isFormatting, setIsFormatting] = useState(false);

  // Format template content on mount
  React.useEffect(() => {
    formatTemplateContent();
  }, [template]);

  const formatTemplateContent = async () => {
    setIsFormatting(true);
    try {
      // Determine the correct section for formatting
      let formatSection: "7" | "8" | "11" | "history_evolution" = template.section;
      
      // Check if this is the History of Evolution template
      if (template.id === 'history-evolution-ai-formatter') {
        formatSection = 'history_evolution';
      }
      
      // Convert language format (fr-CA -> fr, en-US -> en)
      const convertLanguage = (lang: string): 'fr' | 'en' => {
        if (lang?.startsWith('fr')) return 'fr';
        if (lang?.startsWith('en')) return 'en';
        return currentLanguage === 'fr' ? 'fr' : 'en';
      };
      
      const formattingOptions: FormattingOptions = {
        section: formatSection,
        inputLanguage: convertLanguage(template.language || currentLanguage),
        complexity: template.complexity || 'medium'
      };

      const result = await FormattingService.formatTemplateContent(
        template.content,
        formattingOptions
      );

      setFormattedContent(result.formatted);
      setFormattingChanges(result.changes);
      setCompliance(result.compliance);
    } catch (error) {
      console.error('Error formatting template for preview:', error);
      // Use basic formatting as fallback
      const basicFormatted = FormattingService.applyBasicFormatting(
        template.content,
        {
          section: template.section,
          inputLanguage: template.language || currentLanguage
        }
      );
      setFormattedContent(basicFormatted);
      setFormattingChanges(['Basic formatting applied']);
      setCompliance({ cnesst: false, medical_terms: false, structure: false });
    } finally {
      setIsFormatting(false);
    }
  };

  const getComplianceIcon = (isCompliant: boolean) => {
    return isCompliant ? (
      <CheckCircle className="h-3 w-3 text-green-500" />
    ) : (
      <AlertCircle className="h-3 w-3 text-yellow-500" />
    );
  };

  const getComplianceColor = (isCompliant: boolean) => {
    return isCompliant ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <Card className="w-full border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-blue-800">
              {template.title}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 mt-2">
          <Badge variant="outline" className="text-xs">
            Section {template.section}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {template.language || currentLanguage}
          </Badge>
          {template.complexity && (
            <Badge 
              variant="outline" 
              className={`text-xs ${
                template.complexity === 'high' ? 'bg-red-100 text-red-800' :
                template.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}
            >
              {template.complexity}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Compliance Indicators */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`flex items-center space-x-1 p-2 rounded text-xs ${getComplianceColor(compliance.cnesst)}`}>
            {getComplianceIcon(compliance.cnesst)}
            <span className="font-medium">CNESST</span>
          </div>
          <div className={`flex items-center space-x-1 p-2 rounded text-xs ${getComplianceColor(compliance.medical_terms)}`}>
            {getComplianceIcon(compliance.medical_terms)}
            <span className="font-medium">Medical</span>
          </div>
          <div className={`flex items-center space-x-1 p-2 rounded text-xs ${getComplianceColor(compliance.structure)}`}>
            {getComplianceIcon(compliance.structure)}
            <span className="font-medium">Structure</span>
          </div>
        </div>

        {/* Content Toggle */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Template Content</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFormatted(!showFormatted)}
            className="h-6 px-2 text-xs"
          >
            {showFormatted ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            <span className="ml-1">{showFormatted ? 'Original' : 'Formatted'}</span>
          </Button>
        </div>

        {/* Content Display */}
        <div className="bg-white border rounded p-3">
          {isFormatting ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Formatting...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {showFormatted ? (
                <div className="bg-gray-50 p-3 rounded border max-h-32 overflow-y-auto">
                  {renderFormattedContentWithStyledHeaders(formattedContent)}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-xs text-gray-700 font-mono bg-gray-50 p-3 rounded border max-h-32 overflow-y-auto">
                  {template.content}
                </pre>
              )}

              {/* Formatting Changes */}
              {showFormatted && formattingChanges.length > 0 && (
                <div className="bg-blue-50 p-2 rounded border">
                  <h4 className="text-xs font-medium text-blue-800 mb-1">AI Formatting:</h4>
                  <ul className="space-y-1">
                    {formattingChanges.slice(0, 3).map((change, index) => (
                      <li key={index} className="text-xs text-blue-700 flex items-center space-x-1">
                        <CheckCircle className="h-2 w-2 text-blue-600" />
                        <span>{change}</span>
                      </li>
                    ))}
                    {formattingChanges.length > 3 && (
                      <li className="text-xs text-blue-600">
                        +{formattingChanges.length - 3} more changes
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            size="sm"
            onClick={() => onSelect(template)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
