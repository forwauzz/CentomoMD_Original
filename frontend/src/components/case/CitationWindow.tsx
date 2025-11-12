import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Loader2, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import { askDoc } from '@/services/ragClient';
import type { AskResponse } from '@/types/rag';
import { useI18n } from '@/lib/i18n';
import { useUIStore } from '@/stores/uiStore';

interface CitationWindowProps {
  caseId?: string;
  sectionContent?: string;
}

export const CitationWindow: React.FC<CitationWindowProps> = ({
  caseId,
  sectionContent,
}) => {
  const { t } = useI18n();
  const addToast = useUIStore(state => state.addToast);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Reset copy success message
  React.useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError(t('language') === 'fr' ? 'Veuillez entrer une question' : 'Please enter a question');
      return;
    }

    setError(null);
    setLoading(true);
    setResponse(null);

    try {
      const result = await askDoc(trimmedQuestion);
      setResponse(result);
      setQuestion(''); // Clear input after successful submission
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t('language') === 'fr'
          ? 'Une erreur est survenue'
          : 'An error occurred';
      setError(errorMessage);
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopyAnswer = async () => {
    if (!response?.answer) return;

    try {
      await navigator.clipboard.writeText(response.answer);
      setCopySuccess(true);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Auto-generate question based on section content
  const handleAutoQuestion = () => {
    if (sectionContent) {
      setQuestion(
        t('language') === 'fr'
          ? 'Quelles sont les références réglementaires pertinentes pour ce cas?'
          : 'What are the relevant regulatory references for this case?'
      );
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span>{t('citations')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-3">
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          {/* Question Input */}
          <div className="space-y-2 flex-shrink-0">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('askQuestionAboutDocument')}
              rows={2}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={loading || !question.trim()}
                size="sm"
                className="flex-1"
              >
                    {loading ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        {t('searching')}
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-3 w-3 mr-2" />
                        {t('search')}
                      </>
                    )}
              </Button>
              {sectionContent && (
                <Button
                  onClick={handleAutoQuestion}
                  variant="outline"
                  size="sm"
                  title={t('suggestedQuestion')}
                >
                  {t('language') === 'fr' ? 'Auto' : 'Auto'}
                </Button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div className="flex-1 overflow-y-auto space-y-3">
              {/* Answer */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-medium text-blue-900">{t('answer')}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAnswer}
                    className="h-6 w-6 p-0"
                  >
                    {copySuccess ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{response.answer}</p>
              </div>

              {/* Sources */}
              {response.sources && response.sources.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-700">{t('sources')}:</h4>
                  {response.sources.map((source, index) => (
                    <div
                      key={index}
                      className="p-2 bg-gray-50 border border-gray-200 rounded text-xs"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-700">
                          {t('page')} {source.page}
                        </span>
                      </div>
                      <p className="text-gray-600">{source.snippet}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              {response.footer && (
                <p className="text-xs text-gray-500 italic">{response.footer}</p>
              )}
            </div>
          )}

          {/* Empty State */}
          {!response && !loading && !error && (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">{t('askQuestionToGetCitations')}</p>
                <p className="text-xs text-gray-500">{t('ragSystemWillSearch')}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

