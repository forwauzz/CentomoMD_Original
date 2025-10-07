/**
 * Quick Note Form
 * Simple form for quick feedback (≤30s)
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

interface QuickNoteFormProps {
  onClose: () => void;
  transcriptionContext?: TranscriptionContext;
}

export const QuickNoteForm: React.FC<QuickNoteFormProps> = ({ onClose, transcriptionContext }) => {
  const { addItem } = useFeedbackStore();
  const [ratings, setRatings] = useState({
    dictation: undefined as 'good' | 'meh' | 'bad' | undefined,
    transcription: undefined as 'good' | 'meh' | 'bad' | undefined,
    hallucination: undefined as 'good' | 'meh' | 'bad' | undefined,
    context: undefined as 'good' | 'meh' | 'bad' | undefined,
    structure: undefined as 'good' | 'meh' | 'bad' | undefined,
    overall: undefined as 'good' | 'meh' | 'bad' | undefined,
  });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strings = FEEDBACK_STRINGS['en-CA']; // TODO: Use proper i18n

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Filter out undefined ratings
      const filteredRatings = Object.fromEntries(
        Object.entries(ratings).filter(([_, value]) => value !== undefined)
      );

      console.log('Saving feedback with ratings:', filteredRatings);

      // Create feedback item
      const feedbackItem = {
        meta: {
          language: (transcriptionContext?.language === 'fr-CA' ? 'fr-CA' : 'en-CA') as 'fr-CA' | 'en-CA',
          mode: (transcriptionContext?.mode === 'smart_dictation' ? 'smart' : 
                 transcriptionContext?.mode === 'word_for_word' ? 'word-for-word' : 
                 transcriptionContext?.mode === 'ambient' ? 'ambient' : 'smart') as 'smart' | 'word-for-word' | 'ambient',
          template_name: transcriptionContext?.templateName || undefined,
          diarization: transcriptionContext?.diarization || false,
          custom_vocab: transcriptionContext?.customVocab || false,
          timestamp: new Date().toISOString(),
          browser: {
            raw: navigator.userAgent,
          },
          contains_phi: false,
        },
        ratings: filteredRatings,
        artifacts: {},
        highlights: [],
        comment: comment || undefined,
        attachments: [],
        status: 'open' as const,
        ttl_days: 30,
      };

      // Save to store
      await addItem(feedbackItem);
      
      // Reset form
      setRatings({
        dictation: undefined,
        transcription: undefined,
        hallucination: undefined,
        context: undefined,
        structure: undefined,
        overall: undefined,
      });
      setComment('');
      
      onClose();
    } catch (error) {
      console.error('Failed to save feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingField = ({ 
    field, 
    label, 
    tooltip 
  }: { 
    field: keyof typeof ratings; 
    label: string; 
    tooltip: string; 
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <RadioGroup
        value={ratings[field]}
        onValueChange={(value) => setRatings(prev => ({ ...prev, [field]: value as any }))}
        className="flex space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="good" id={`${field}-good`} />
          <Label htmlFor={`${field}-good`} className="text-green-600">
            {strings.good}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="meh" id={`${field}-meh`} />
          <Label htmlFor={`${field}-meh`} className="text-yellow-600">
            {strings.meh}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="bad" id={`${field}-bad`} />
          <Label htmlFor={`${field}-bad`} className="text-red-600">
            {strings.bad}
          </Label>
        </div>
      </RadioGroup>
      <p className="text-xs text-gray-500">{tooltip}</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RatingField
          field="dictation"
          label={strings.categories.dictation}
          tooltip={strings.tooltips.good}
        />
        <RatingField
          field="transcription"
          label={strings.categories.transcription}
          tooltip={strings.tooltips.meh}
        />
        <RatingField
          field="hallucination"
          label={strings.categories.hallucination}
          tooltip={strings.tooltips.bad}
        />
        <RatingField
          field="context"
          label={strings.categories.context}
          tooltip={strings.tooltips.good}
        />
        <RatingField
          field="structure"
          label={strings.categories.structure}
          tooltip={strings.tooltips.meh}
        />
        <RatingField
          field="overall"
          label={strings.categories.overall}
          tooltip={strings.tooltips.bad}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Additional Comments</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Any additional feedback or suggestions..."
          className="min-h-[100px]"
        />
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
