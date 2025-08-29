import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  disabled = false,
  children
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(value || '');
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);

  const handleSelect = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === SelectTrigger) {
            return React.cloneElement(child, {
              ref: triggerRef,
              onClick: () => !disabled && setIsOpen(!isOpen),
              disabled,
              isOpen
            });
          }
          if (child.type === SelectContent && isOpen) {
            return React.cloneElement(child, {
              onSelect: handleSelect,
              selectedValue
            });
          }
        }
        return child;
      })}
    </div>
  );
};

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps & { onClick?: () => void; disabled?: boolean; isOpen?: boolean }>(
  ({ children, className, onClick, disabled, isOpen, ...props }, ref) => (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
    </button>
  )
);

export const SelectContent: React.FC<SelectContentProps & { onSelect?: (value: string) => void; selectedValue?: string }> = ({
  children,
  className,
  onSelect,
  selectedValue
}) => (
  <div className={cn(
    "absolute top-full z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
    className
  )}>
    <div className="p-1">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          return React.cloneElement(child, {
            onClick: () => onSelect?.(child.props.value),
            isSelected: child.props.value === selectedValue
          });
        }
        return child;
      })}
    </div>
  </div>
);

export const SelectItem: React.FC<SelectItemProps & { onClick?: () => void; isSelected?: boolean }> = ({
  children,
  className,
  onClick,
  isSelected,
  ...props
}) => (
  <div
    onClick={onClick}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
      isSelected && "bg-accent text-accent-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder, className }) => (
  <span className={cn("block truncate", className)}>
    {placeholder}
  </span>
);
