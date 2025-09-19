/**
 * Collapsible Component
 * Re-usable collapsible component
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface CollapsibleProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  children,
  defaultOpen = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn('w-full', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === CollapsibleTrigger) {
            return React.cloneElement(child, {
              ...child.props,
              isOpen,
              onToggle: () => setIsOpen(!isOpen),
            });
          }
          if (child.type === CollapsibleContent) {
            return React.cloneElement(child, {
              ...child.props,
              isOpen,
            });
          }
        }
        return child;
      })}
    </div>
  );
};

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({
  children,
  onToggle,
  className
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex items-center space-x-2 text-sm font-medium hover:text-gray-700 transition-colors',
        className
      )}
    >
      {children}
    </button>
  );
};

interface CollapsibleContentProps {
  children: React.ReactNode;
  isOpen?: boolean;
  className?: string;
}

export const CollapsibleContent: React.FC<CollapsibleContentProps> = ({
  children,
  isOpen,
  className
}) => {
  if (!isOpen) return null;

  return (
    <div className={cn('mt-2', className)}>
      {children}
    </div>
  );
};
