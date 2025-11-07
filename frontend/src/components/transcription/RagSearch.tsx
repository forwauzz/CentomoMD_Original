/**
 * RAG Search Component
 * Allows users to search for keywords in documents using RAG API
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { searchDoc } from '@/services/ragClient';
import type { SearchHit } from '@/types/rag';
import { useI18n } from '@/lib/i18n';

export const RagSearch: React.FC = () => {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<SearchHit[]>([]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError(t('ragEmptyState') || 'Veuillez entrer un terme de recherche');
      return;
    }

    setError(null);
    setLoading(true);
    setHits([]);

    try {
      const response = await searchDoc(trimmedQuery, 12);
      setHits(response.results || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      setHits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Submit on Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('ragSearchPlaceholder')}
              disabled={loading}
              className="flex-1 focus:ring-2 focus:ring-blue-500 border-gray-300"
              aria-label={t('ragSearchPlaceholder')}
            />
            <Button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('ragSearching')}
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  {t('ragSearchButton')}
                </>
              )}
            </Button>
          </div>
          {error && (
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </form>

      {/* Search Results */}
      {hits.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              {hits.length} {t('ragResults')}
            </h4>
            <p className="text-xs text-gray-500 italic">
              {t('ragClickPage')}
            </p>
          </div>
          <ul className="space-y-2">
            {hits.map((hit, index) => (
              <li key={index} className="text-sm text-gray-600">
                <div className="bg-gray-50 rounded-md p-3 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700 flex items-center space-x-1">
                      <span className="text-blue-600">Page {hit.page}</span>
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                      Score: {Math.round(hit.score * 100) / 100}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                    {hit.snippet}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty State */}
      {!hits.length && !loading && !error && (
        <p className="text-sm text-gray-500 italic text-center py-4">
          {t('ragEmptyState')}
        </p>
      )}
    </div>
  );
};

