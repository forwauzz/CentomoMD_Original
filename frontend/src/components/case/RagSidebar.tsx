/**
 * RAG Sidebar Component
 * Modern sidebar with chat interface for RAG functionality
 */

import React, { useState } from 'react';
import { RagChat } from '@/components/transcription/RagChat';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeatureFlags } from '@/lib/featureFlags';

interface RagSidebarProps {
  className?: string;
  hideHeader?: boolean;
}

export const RagSidebar: React.FC<RagSidebarProps> = ({ className }) => {
  const featureFlags = useFeatureFlags();
  const [isOpen, setIsOpen] = useState(false);

  // Don't render if feature is disabled
  if (!featureFlags.ragChat) {
    return null;
  }

  return (
    <>
      {/* Toggle Button - Always visible when feature is enabled */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed right-4 top-1/2 -translate-y-1/2 z-40",
            "bg-[#009639] hover:bg-[#007a2e] text-white",
            "shadow-lg rounded-full p-3 h-auto",
            "transition-all duration-300",
            className
          )}
          aria-label="Ouvrir le chat RAG"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full z-50",
          "bg-white border-l border-gray-200 shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          "flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full",
          "w-full sm:w-96 md:w-[420px] lg:w-[480px]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              Assistant RAG
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 hover:bg-gray-200"
              aria-label="Fermer le chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="h-full">
            <RagChat hideHeader={true} />
          </div>
        </div>
      </div>

      {/* Backdrop - Close sidebar when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

