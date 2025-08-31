import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Zap,
  Clock,
  Tag
} from 'lucide-react';
import { TemplateJSON } from './TemplateDropdown';
import { FormattingService, FormattingOptions } from '@/services/formattingService';

interface TemplatePreviewProps {
  template: TemplateJSON;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: TemplateJSON) => void;
  currentSection: "7" | "8" | "11";
  currentLanguage: "fr" | "en";
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  isOpen,
  onClose,
  onSelect,
  currentSection,
  currentLanguage
}) => {
  const [showFormatted, setShowFormatted] = useState(false);
  const [formattedContent, setFormattedContent] = useState<string>('');
  const [formattingChanges, setFormattingChanges] = useState<string[]>([]);
  const [compliance, setCompliance] = useState({
    cnesst: false,
    medical_terms: false,
    structure: false,
    terminology: false,
    chronology: false
  });
  const [statistics, setStatistics] = useState({
    wordCount: 0,
    sentenceCount: 0,
    medicalTermsCount: 0,
    complianceScore: 0
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFormatting, setIsFormatting] = useState(false);

  // Auto-format template content when preview opens
  useEffect(() => {
    if (isOpen && template) {
      formatTemplateContent();
    }
  }, [isOpen, template]);

  const formatTemplateContent = async () => {
    setIsFormatting(true);
    try {
      const formattingOptions: FormattingOptions = {
        section: template.section,
        language: template.language || currentLanguage,
        complexity: template.complexity || 'medium'
      };

      const result = await FormattingService.formatTemplateContent(
        template.content,
        formattingOptions
      );

      setFormattedContent(result.formatted);
      setFormattingChanges(result.changes);
      setCompliance(result.compliance);
      setStatistics(result.statistics);
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Error formatting template for preview:', error);
      // Use basic formatting as fallback
      const basicFormatted = FormattingService.applyBasicFormatting(
        template.content,
        {
          section: template.section,
          language: template.language || currentLanguage
        }
      );
             setFormattedContent(basicFormatted);
       setFormattingChanges(['Basic formatting applied']);
       setCompliance({ cnesst: false, medical_terms: false, structure: false, terminology: false, chronology: false });
       setStatistics({ wordCount: 0, sentenceCount: 0, medicalTermsCount: 0, complianceScore: 0 });
       setSuggestions(['Basic formatting applied - advanced features unavailable']);
    } finally {
      setIsFormatting(false);
    }
  };

  const getComplianceIcon = (isCompliant: boolean) => {
    return isCompliant ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-yellow-500" />
    );
  };

  const getComplianceText = (isCompliant: boolean, type: string) => {
    return isCompliant ? `${type} Compliant` : `${type} Needs Review`;
  };

  const getComplianceColor = (isCompliant: boolean) => {
    return isCompliant ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl font-semibold text-gray-800">
                  {template.title}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Section {template.section}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {template.language || currentLanguage}
                  </Badge>
                  {template.complexity && (
                    <Badge variant="outline" className="text-xs">
                      {template.complexity}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Template Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Tag className="h-4 w-4" />
                <span>Tags:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {template.tags?.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                )) || (
                  <span className="text-sm text-gray-500 italic">No tags</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Category:</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {template.category || 'General'}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Zap className="h-4 w-4" />
                <span>Complexity:</span>
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  template.complexity === 'high' ? 'bg-red-100 text-red-800' :
                  template.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}
              >
                {template.complexity || 'medium'}
              </Badge>
            </div>
          </div>

                     {/* Enhanced Compliance Indicators */}
           <div className="bg-gray-50 p-4 rounded-lg">
             <h3 className="text-sm font-medium text-gray-700 mb-3">CNESST Compliance</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               <div className={`flex items-center space-x-2 p-2 rounded ${getComplianceColor(compliance.cnesst)}`}>
                 {getComplianceIcon(compliance.cnesst)}
                 <span className="text-sm font-medium">
                   {getComplianceText(compliance.cnesst, 'CNESST')}
                 </span>
               </div>
               <div className={`flex items-center space-x-2 p-2 rounded ${getComplianceColor(compliance.medical_terms)}`}>
                 {getComplianceIcon(compliance.medical_terms)}
                 <span className="text-sm font-medium">
                   {getComplianceText(compliance.medical_terms, 'Medical Terms')}
                 </span>
               </div>
               <div className={`flex items-center space-x-2 p-2 rounded ${getComplianceColor(compliance.structure)}`}>
                 {getComplianceIcon(compliance.structure)}
                 <span className="text-sm font-medium">
                   {getComplianceText(compliance.structure, 'Structure')}
                 </span>
               </div>
               <div className={`flex items-center space-x-2 p-2 rounded ${getComplianceColor(compliance.terminology)}`}>
                 {getComplianceIcon(compliance.terminology)}
                 <span className="text-sm font-medium">
                   {getComplianceText(compliance.terminology, 'Terminology')}
                 </span>
               </div>
               <div className={`flex items-center space-x-2 p-2 rounded ${getComplianceColor(compliance.chronology)}`}>
                 {getComplianceIcon(compliance.chronology)}
                 <span className="text-sm font-medium">
                   {getComplianceText(compliance.chronology, 'Chronology')}
                 </span>
               </div>
               <div className="flex items-center space-x-2 p-2 rounded bg-blue-100 text-blue-800">
                 <span className="text-sm font-medium">
                   Score: {statistics.complianceScore}%
                 </span>
               </div>
             </div>
           </div>

           {/* Content Statistics */}
           <div className="bg-blue-50 p-4 rounded-lg">
             <h3 className="text-sm font-medium text-blue-800 mb-3">Content Statistics</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               <div className="text-center">
                 <div className="text-lg font-bold text-blue-600">{statistics.wordCount}</div>
                 <div className="text-xs text-blue-700">Words</div>
               </div>
               <div className="text-center">
                 <div className="text-lg font-bold text-blue-600">{statistics.sentenceCount}</div>
                 <div className="text-xs text-blue-700">Sentences</div>
               </div>
               <div className="text-center">
                 <div className="text-lg font-bold text-blue-600">{statistics.medicalTermsCount}</div>
                 <div className="text-xs text-blue-700">Medical Terms</div>
               </div>
               <div className="text-center">
                 <div className="text-lg font-bold text-blue-600">{statistics.complianceScore}%</div>
                 <div className="text-xs text-blue-700">Compliance</div>
               </div>
             </div>
           </div>

          {/* Content Toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800">Template Content</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFormatted(!showFormatted)}
                className="flex items-center space-x-2"
              >
                {showFormatted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{showFormatted ? 'Show Original' : 'Show Formatted'}</span>
              </Button>
            </div>
          </div>

          {/* Content Display */}
          <div className="bg-white border rounded-lg p-4">
            {isFormatting ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Formatting template...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded border">
                    {showFormatted ? formattedContent : template.content}
                  </pre>
                </div>

                {/* Formatting Changes */}
                {showFormatted && formattingChanges.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded border">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">AI Formatting Applied:</h4>
                    <ul className="space-y-1">
                      {formattingChanges.map((change, index) => (
                        <li key={index} className="text-sm text-blue-700 flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-blue-600" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                                 )}
               </div>
             )}
           </div>

           {/* Suggestions */}
           {suggestions.length > 0 && (
             <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
               <h4 className="text-sm font-medium text-yellow-800 mb-2">Suggestions for Improvement</h4>
               <ul className="space-y-1">
                 {suggestions.map((suggestion, index) => (
                   <li key={index} className="text-sm text-yellow-700 flex items-center space-x-2">
                     <span className="text-yellow-600">•</span>
                     <span>{suggestion}</span>
                   </li>
                 ))}
               </ul>
             </div>
           )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={() => onSelect(template)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Use This Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
