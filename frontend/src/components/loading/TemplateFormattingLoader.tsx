/**
 * Template Formatting Loader
 * Full-screen loading overlay with blurred content during template formatting
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface TemplateFormattingLoaderProps {
  message: string;
}

export const TemplateFormattingLoader: React.FC<TemplateFormattingLoaderProps> = ({ message }) => {
  // Animated dots component
  const AnimatedDots = () => {
    return (
      <span className="inline-flex gap-1">
        <span className="animate-[bounce_1s_ease-in-out_infinite]">.</span>
        <span className="animate-[bounce_1s_ease-in-out_0.2s_infinite]">.</span>
        <span className="animate-[bounce_1s_ease-in-out_0.4s_infinite]">.</span>
      </span>
    );
  };

  // Use message as key to force re-render when it changes
  return (
    <div key={message} className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* CentomoMD Logo/Title */}
        <h1 className="text-3xl font-bold text-white">CentomoMD</h1>
        
        {/* Loading Message */}
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-lg font-medium text-white" key={message}>
            {message}
            <AnimatedDots />
          </p>
        </div>
      </div>
    </div>
  );
};

