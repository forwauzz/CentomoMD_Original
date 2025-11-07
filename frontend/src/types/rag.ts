/**
 * RAG (Retrieval-Augmented Generation) Type Definitions
 */

export type RagSource = {
  page: number;
  snippet: string;
};

export type AskResponse = {
  answer: string;
  sources: RagSource[];
  used_pages: number[];
  footer: string;
};

