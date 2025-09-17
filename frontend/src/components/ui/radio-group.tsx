/**
 * Radio Group Component
 * Re-usable radio group component
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-2', className)}
        role="radiogroup"
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              ...child.props,
              checked: child.props.value === value,
              onValueChange: (checked: boolean) => {
                if (checked && onValueChange) {
                  onValueChange(child.props.value);
                }
              },
            });
          }
          return child;
        })}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

interface RadioGroupItemProps {
  value: string;
  id?: string;
  checked?: boolean;
  onValueChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, checked, onValueChange, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="radio"
        id={id}
        value={value}
        checked={checked}
        onChange={(e) => onValueChange?.(e.target.checked)}
        disabled={disabled}
        className={cn(
          'h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500',
          className
        )}
        {...props}
      />
    );
  }
);

RadioGroupItem.displayName = 'RadioGroupItem';
