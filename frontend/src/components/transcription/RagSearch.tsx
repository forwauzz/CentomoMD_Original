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

export const RagSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<SearchHit[]>([]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError('Veuillez entrer un terme de recherche');
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
              placeholder="Ex.: poignet, arthrodèse, 106129"
              disabled={loading}
              className="flex-1"
              aria-label="Recherche dans le document"
            />
            <Button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recherche...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Chercher
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
              {hits.length} résultat{hits.length > 1 ? 's' : ''}
            </h4>
            <p className="text-xs text-gray-500 italic">
              Cliquez une page dans le PDF pour vérifier si besoin.
            </p>
          </div>
          <ul className="space-y-2">
            {hits.map((hit, index) => (
              <li key={index} className="text-sm text-gray-600">
                <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">
                      Page {hit.page}
                    </span>
                    <span className="text-xs text-gray-500">
                      Score: {Math.round(hit.score * 100) / 100}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
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
          Entrez un terme de recherche pour trouver des occurrences dans le document…
        </p>
      )}
    </div>
  );
};

