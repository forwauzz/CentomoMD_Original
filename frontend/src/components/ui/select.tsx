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
  children?: React.ReactNode;
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
    console.log('Select: handleSelect called with:', newValue);
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
              onClick: () => {
                console.log('Select: trigger clicked, disabled:', disabled, 'isOpen:', isOpen);
                if (!disabled) {
                  setIsOpen(!isOpen);
                }
              },
              disabled,
              isOpen,
              selectedValue
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

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps & { 
  onClick?: () => void; 
  disabled?: boolean; 
  isOpen?: boolean;
  selectedValue?: string;
}>(
  ({ children, className, onClick, disabled, isOpen, selectedValue, ...props }, ref) => (
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

export const SelectContent: React.FC<SelectContentProps & { 
  onSelect?: (value: string) => void; 
  selectedValue?: string;
}> = ({
  children,
  className,
  onSelect,
  selectedValue
}) => (
  <div className={cn(
    "absolute top-full z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md",
    className
  )}>
    <div className="p-1">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          return React.cloneElement(child, {
            onClick: () => {
              console.log('SelectContent: item clicked with value:', child.props.value);
              onSelect?.(child.props.value);
            },
            isSelected: child.props.value === selectedValue
          });
        }
        return child;
      })}
    </div>
  </div>
);

export const SelectItem: React.FC<SelectItemProps & { 
  onClick?: () => void; 
  isSelected?: boolean;
}> = ({
  children,
  className,
  onClick,
  isSelected,
  ...props
}) => (
  <div
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('SelectItem: clicked');
      onClick?.();
    }}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
      isSelected && "bg-accent text-accent-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const SelectValue: React.FC<SelectValueProps> = ({ 
  placeholder, 
  className,
  children 
}) => (
  <span className={cn("block truncate", className)}>
    {children || placeholder}
  </span>
);
