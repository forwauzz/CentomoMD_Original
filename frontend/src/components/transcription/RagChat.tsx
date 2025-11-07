/**
 * RAG Chat Component
 * Allows users to ask questions about documents using RAG API
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare, Copy, CheckCircle, Loader2, AlertCircle, Search } from 'lucide-react';
import { askDoc } from '@/services/ragClient';
import type { AskResponse } from '@/types/rag';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RagSearch } from './RagSearch';

const SNIPPET_MAX_LENGTH = 240;

/**
 * Truncate text to max length and add ellipsis
 */
const truncateSnippet = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

export const RagChat: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AskResponse | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debug: Log component mount
  useEffect(() => {
    console.log('[RagChat] Component mounted');
  }, []);

  // Reset copy success message after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError('Veuillez entrer une question');
      return;
    }

    setError(null);
    setLoading(true);
    setData(null);

    try {
      const response = await askDoc(trimmedQuestion);
      setData(response);
      setQuestion(''); // Clear input after successful submission
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (but allow Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopyAnswer = async () => {
    if (!data?.answer) return;

    try {
      await navigator.clipboard.writeText(data.answer);
      setCopySuccess(true);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <span>Document Q&A et Recherche</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="ask" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ask" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Q&A</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Recherche</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ask" className="space-y-4 mt-4">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez une question sur le document…"
              disabled={loading}
              className="min-h-[80px] resize-none"
              aria-label="Question sur le document"
            />
            {error && (
              <div className="flex items-center space-x-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading || !question.trim()}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Poser la question'
            )}
          </Button>
        </form>

        {/* Answer Display */}
        {data && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Answer Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Réponse</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAnswer}
                  className="h-7 px-2 text-xs"
                  aria-label="Copier la réponse"
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle className="mr-1 h-3 w-3 text-green-600" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words" style={{ lineHeight: '1.7' }}>
                  {data.answer}
                </p>
              </div>
            </div>

            {/* Sources Section */}
            {data.sources && data.sources.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Sources</h4>
                <ul className="space-y-2">
                  <TooltipProvider>
                    {data.sources.map((source, index) => {
                      const isTruncated = source.snippet.length > SNIPPET_MAX_LENGTH;
                      const displaySnippet = isTruncated 
                        ? truncateSnippet(source.snippet, SNIPPET_MAX_LENGTH)
                        : source.snippet;

                      return (
                        <li key={index} className="text-sm text-gray-600">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                                <span className="font-medium text-gray-700">Page {source.page}</span>
                                {' — '}
                                <span>{displaySnippet}</span>
                              </div>
                            </TooltipTrigger>
                            {isTruncated && (
                              <TooltipContent className="max-w-md">
                                <p className="text-sm whitespace-pre-wrap">{source.snippet}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </li>
                      );
                    })}
                  </TooltipProvider>
                </ul>
              </div>
            )}

            {/* Footer */}
            {data.footer && (
              <div className="text-xs text-gray-500 italic pt-2 border-t border-gray-200">
                {data.footer}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!data && !loading && !error && (
          <p className="text-sm text-gray-500 italic text-center py-4">
            Posez une question sur le document…
          </p>
        )}
          </TabsContent>
          <TabsContent value="search" className="mt-4">
            <RagSearch />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

