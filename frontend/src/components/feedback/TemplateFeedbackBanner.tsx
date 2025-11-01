/**
 * Template Feedback Banner
 * Centered modal-style feedback banner for template ratings
 */

import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TemplateFeedbackBannerProps {
  templateId: string;
  templateName: string;
  onRating: (rating: number) => void;
  onDismiss: () => void;
}

export const TemplateFeedbackBanner: React.FC<TemplateFeedbackBannerProps> = ({
  templateId,
  templateName,
  onRating,
  onDismiss,
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
    onRating(rating);
  };

  const handleDismiss = () => {
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 animate-in fade-in-50 slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              How was this template?
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {templateName}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss feedback"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Star Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((rating) => {
            const isActive = hoveredRating ? rating <= hoveredRating : selectedRating ? rating <= selectedRating : false;
            return (
              <button
                key={rating}
                onClick={() => handleStarClick(rating)}
                onMouseEnter={() => setHoveredRating(rating)}
                onMouseLeave={() => setHoveredRating(null)}
                className="transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                disabled={selectedRating !== null}
                aria-label={`Rate ${rating} stars`}
              >
                <Star
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Helper text */}
        {selectedRating === null && (
          <p className="text-xs text-gray-500">
            Click a star to rate this template
          </p>
        )}

        {/* Success message */}
        {selectedRating !== null && (
          <p className="text-xs text-green-600 font-medium">
            Thank you for your feedback!
          </p>
        )}
      </div>
    </div>
  );
};

