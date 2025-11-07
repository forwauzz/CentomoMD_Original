/**
 * RAG API Client Service
 * Handles communication with the RAG (Retrieval-Augmented Generation) API
 */

import { getRagApiBase } from '@/config/rag';
import type { AskResponse, SearchResponse } from '@/types/rag';

/**
 * Ask a question to the RAG API
 * @param question - The question to ask
 * @returns Promise resolving to the RAG response
 * @throws Error if the API request fails
 */
export async function askDoc(question: string): Promise<AskResponse> {
  if (!question || question.trim().length === 0) {
    throw new Error('Question cannot be empty');
  }

  try {
    const apiBase = getRagApiBase();
    const url = `${apiBase}/ask`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: question.trim() }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        // If error text is not JSON, use it as-is
        if (errorText) {
          errorMessage = `${errorMessage} - ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const result: AskResponse = await response.json();
    
    // Validate response structure
    if (!result.answer || !Array.isArray(result.sources)) {
      throw new Error('Invalid response format from RAG API');
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to communicate with RAG API');
  }
}

/**
 * Search for keywords in the document (no LLM generation)
 * @param q - The search query (keywords)
 * @param topN - Maximum number of results to return (default: 10)
 * @returns Promise resolving to the search response
 * @throws Error if the API request fails
 */
export async function searchDoc(q: string, topN = 10): Promise<SearchResponse> {
  if (!q || q.trim().length === 0) {
    throw new Error('Search query cannot be empty');
  }

  try {
    const apiBase = getRagApiBase();
    // Build query string manually to work with both relative and absolute URLs
    const queryParams = new URLSearchParams({
      q: q.trim(),
      top_n: String(topN),
    });
    const url = `${apiBase}/search?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        // If error text is not JSON, use it as-is
        if (errorText) {
          errorMessage = `${errorMessage} - ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const result: SearchResponse = await response.json();
    
    // Validate response structure
    if (!result.query || !Array.isArray(result.results)) {
      throw new Error('Invalid response format from RAG search API');
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to communicate with RAG search API');
  }
}

