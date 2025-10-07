/**
 * Full Case Form
 * Comprehensive form for detailed feedback (2-3 min)
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { FEEDBACK_STRINGS } from '@/types/feedback';
import { useFeedbackStore } from '@/stores/feedbackStore';

interface TranscriptionContext {
  currentTranscript: string;
  mode: string;
  language: string;
  templateName: string;
  diarization: boolean;
  customVocab: boolean;
  sessionId?: string;
  paragraphs: string[];
  segments: any[];
  orthopedicNarrative?: any;
}

interface FullCaseFormProps {
  onClose: () => void;
  transcriptionContext?: TranscriptionContext;
}

export const FullCaseForm: React.FC<FullCaseFormProps> = ({ onClose, transcriptionContext }) => {
  const { addItem } = useFeedbackStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [containsPhi, setContainsPhi] = useState(false);
  
  // Run Context - Auto-populate from transcription context
  const [runContext, setRunContext] = useState({
    mode: (transcriptionContext?.mode === 'smart_dictation' ? 'smart' : 
           transcriptionContext?.mode === 'word_for_word' ? 'word-for-word' : 
           transcriptionContext?.mode === 'ambient' ? 'ambient' : 'smart') as 'smart' | 'word-for-word' | 'ambient',
    language: (transcriptionContext?.language === 'fr-CA' ? 'fr-CA' : 'en-CA') as 'fr-CA' | 'en-CA',
    templateName: transcriptionContext?.templateName || '',
    diarization: transcriptionContext?.diarization || false,
    customVocab: transcriptionContext?.customVocab || false,
    timestamp: new Date().toISOString(),
  });

  // Artifacts - Auto-populate with current transcript
  const [artifacts, setArtifacts] = useState({
    rawText: transcriptionContext?.currentTranscript || '',
    templatedText: transcriptionContext?.paragraphs?.join('\n\n') || '',
    finalText: transcriptionContext?.orthopedicNarrative?.summary ? 
      Object.entries(transcriptionContext.orthopedicNarrative.summary)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n\n') : '',
    templateName: transcriptionContext?.templateName || '',
  });

  // Highlights
  const [highlights, setHighlights] = useState<Array<{
    id: string;
    source: 'raw' | 'templated' | 'final';
    startLine?: number;
    endLine?: number;
    note?: string;
  }>>([]);

  const strings = FEEDBACK_STRINGS['en-CA']; // TODO: Use proper i18n

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create feedback item
      const feedbackItem = {
        meta: {
          language: runContext.language,
          mode: runContext.mode,
          template_name: runContext.templateName || undefined,
          diarization: runContext.diarization,
          custom_vocab: runContext.customVocab,
          timestamp: runContext.timestamp,
          browser: {
            raw: navigator.userAgent,
          },
          contains_phi: containsPhi,
        },
        ratings: {
          // No ratings for full case form - can be added later
        },
        artifacts: {
          raw_text: artifacts.rawText || undefined,
          templated_text: artifacts.templatedText || undefined,
          final_text: artifacts.finalText || undefined,
          template_name: artifacts.templateName || undefined,
        },
        highlights: highlights,
        comment: undefined,
        attachments: [],
        status: 'open' as const,
        ttl_days: 30,
      };

      // Save to store
      await addItem(feedbackItem);
      
      // Reset form
      setRunContext({
        mode: 'smart',
        language: 'en-CA',
        templateName: '',
        diarization: false,
        customVocab: false,
        timestamp: new Date().toISOString(),
      });
      setArtifacts({
        rawText: '',
        templatedText: '',
        finalText: '',
        templateName: '',
      });
      setHighlights([]);
      setContainsPhi(false);
      
      onClose();
    } catch (error) {
      console.error('Failed to save feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addHighlight = () => {
    const newHighlight = {
      id: `highlight_${Date.now()}`,
      source: 'raw' as const,
      startLine: undefined,
      endLine: undefined,
      note: '',
    };
    setHighlights(prev => [...prev, newHighlight]);
  };

  const removeHighlight = (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
  };

  const updateHighlight = (id: string, updates: Partial<typeof highlights[0]>) => {
    setHighlights(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Run Context */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center space-x-2 text-sm font-medium">
          <ChevronDown className="h-4 w-4" />
          <span>Run Context</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mode">Mode</Label>
              <select
                id="mode"
                value={runContext.mode}
                onChange={(e) => setRunContext(prev => ({ ...prev, mode: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="smart">Smart</option>
                <option value="word-for-word">Word-for-Word</option>
                <option value="ambient">Ambient</option>
              </select>
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={runContext.language}
                onChange={(e) => setRunContext(prev => ({ ...prev, language: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="en-CA">English (Canada)</option>
                <option value="fr-CA">Français (Canada)</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={runContext.templateName}
                onChange={(e) => setRunContext(prev => ({ ...prev, templateName: e.target.value }))}
                placeholder="e.g., Section 7 CNESST"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="diarization"
                  checked={runContext.diarization}
                  onCheckedChange={(checked) => setRunContext(prev => ({ ...prev, diarization: !!checked }))}
                />
                <Label htmlFor="diarization">Diarization</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customVocab"
                  checked={runContext.customVocab}
                  onCheckedChange={(checked) => setRunContext(prev => ({ ...prev, customVocab: !!checked }))}
                />
                <Label htmlFor="customVocab">Custom Vocab</Label>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Raw Text */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center space-x-2 text-sm font-medium">
          <ChevronRight className="h-4 w-4" />
          <span>Raw Transcript</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-4">
          <Textarea
            value={artifacts.rawText}
            onChange={(e) => setArtifacts(prev => ({ ...prev, rawText: e.target.value }))}
            placeholder="Paste or upload raw transcript..."
            className="min-h-[100px]"
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Templated Text */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center space-x-2 text-sm font-medium">
          <ChevronRight className="h-4 w-4" />
          <span>Templated Text</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="templateName2">Template Used</Label>
              <Input
                id="templateName2"
                value={artifacts.templateName}
                onChange={(e) => setArtifacts(prev => ({ ...prev, templateName: e.target.value }))}
                placeholder="Template name"
              />
            </div>
          </div>
          <Textarea
            value={artifacts.templatedText}
            onChange={(e) => setArtifacts(prev => ({ ...prev, templatedText: e.target.value }))}
            placeholder="Paste or upload templated transcript..."
            className="min-h-[100px]"
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Final Text */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center space-x-2 text-sm font-medium">
          <ChevronRight className="h-4 w-4" />
          <span>Final Expected Text</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-4">
          <Textarea
            value={artifacts.finalText}
            onChange={(e) => setArtifacts(prev => ({ ...prev, finalText: e.target.value }))}
            placeholder="What the final output should look like..."
            className="min-h-[100px]"
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Highlights */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center space-x-2 text-sm font-medium">
          <ChevronRight className="h-4 w-4" />
          <span>Highlights ({highlights.length})</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          {highlights.map((highlight) => (
            <div key={highlight.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Highlight {highlight.id.slice(-4)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeHighlight(highlight.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Source</Label>
                  <select
                    value={highlight.source}
                    onChange={(e) => updateHighlight(highlight.id, { source: e.target.value as any })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="raw">Raw</option>
                    <option value="templated">Templated</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div>
                  <Label>Start Line</Label>
                  <Input
                    type="number"
                    value={highlight.startLine || ''}
                    onChange={(e) => updateHighlight(highlight.id, { startLine: parseInt(e.target.value) || undefined })}
                    placeholder="Line number"
                  />
                </div>
                <div>
                  <Label>End Line</Label>
                  <Input
                    type="number"
                    value={highlight.endLine || ''}
                    onChange={(e) => updateHighlight(highlight.id, { endLine: parseInt(e.target.value) || undefined })}
                    placeholder="Line number"
                  />
                </div>
              </div>
              
              <div>
                <Label>Note</Label>
                <Textarea
                  value={highlight.note || ''}
                  onChange={(e) => updateHighlight(highlight.id, { note: e.target.value })}
                  placeholder="Describe the issue or highlight..."
                  className="min-h-[60px]"
                />
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={addHighlight}
            className="w-full"
          >
            Add Highlight
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* PHI Toggle */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="containsPhi"
            checked={containsPhi}
            onCheckedChange={(checked) => setContainsPhi(!!checked)}
          />
          <Label htmlFor="containsPhi">{strings.phiToggle}</Label>
        </div>
        <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
          {strings.phiReminder}
        </p>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          {strings.cancel}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? 'Saving...' : strings.save}
        </Button>
      </div>
    </form>
  );
};
