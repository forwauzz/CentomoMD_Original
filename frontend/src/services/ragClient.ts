/**
 * RAG API Client Service
 * Handles communication with the RAG (Retrieval-Augmented Generation) API
 */

import { getRagApiBase } from '@/config/rag';
import type { AskResponse } from '@/types/rag';

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

