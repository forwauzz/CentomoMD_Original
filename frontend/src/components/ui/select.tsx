import * as React from "react";

/** Generic Select
 * - Closed by default
 * - Opens only on click
 * - Closes on select / outside click / Escape
 * - Supports controlled (open) or uncontrolled (defaultOpen)
 */
export type SelectItem<T extends string = string> = {
  label: string;
  value: T;
};

type Props<T extends string = string> = {
  value: T | null;
  onValueChange: (v: T) => void;

  // NEW: standard open control API (replaces initialOpen)
  open?: boolean;                    // controlled
  defaultOpen?: boolean;             // uncontrolled initial
  onOpenChange?: (next: boolean) => void;

  disabled?: boolean;
  items: Array<SelectItem<T>>;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;

  // optional id for aria
  id?: string;
};

function useControlledOpen({
  open,
  defaultOpen = false,
  onOpenChange,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const isControlled = open !== undefined;
  const [inner, setInner] = React.useState<boolean>(!!defaultOpen);

  const state = isControlled ? (open as boolean) : inner;
  const setState = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInner(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  return [state, setState] as const;
}

export function Select<T extends string = string>({
  value,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled,
  items,
  placeholder = "Select…",
  className,
  buttonClassName,
  menuClassName,
  id,
}: Props<T>) {
  // CLOSED BY DEFAULT
  const [open, setOpen] = useControlledOpen({ open: openProp, defaultOpen, onOpenChange });
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const toggle = React.useCallback(() => {
    if (!disabled) setOpen(!open);
  }, [disabled, open, setOpen]);

  const close = React.useCallback(() => setOpen(false), [setOpen]);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      const n = e.target as Node | null;
      if (rootRef.current && n && !rootRef.current.contains(n)) close();
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open, close]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`} id={id}>
      {/* Prevent blur-before-click: use onMouseDown preventDefault, then onClick toggles */}
      <button
        type="button"
        className={`select-trigger ${buttonClassName ?? ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={!!disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggle}
      >
        <span className={`flex-1 text-left min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${!value ? 'text-base font-bold text-gray-700' : ''}`}>
          {items.find((i) => i.value === value)?.label ?? placeholder}
        </span>
        <span aria-hidden className="flex-shrink-0">▾</span>
      </button>

      {/* MENU — truly non-interactive when closed */}
      <div
        role="listbox"
        className={`select-menu ${open ? "open" : ""} ${menuClassName ?? ""}`}
        aria-hidden={!open}
      >
        {items.map((i) => (
          <div
            key={i.value}
            role="option"
            aria-selected={value === i.value}
            className={`select-option ${value === i.value ? "selected" : ""}`}
            onClick={() => {
              onValueChange(i.value);
              close();
            }}
          >
            {i.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// Legacy exports for backward compatibility
export const SelectTrigger = Select;
export const SelectContent = () => null;
export const SelectItem = () => null;
export const SelectValue = () => null;
