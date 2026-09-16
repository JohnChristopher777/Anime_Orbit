import React from "react";
import { Check, ChevronDown } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  tone?: "default" | "danger";
}

interface AppDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const AppDropdown: React.FC<AppDropdownProps> = ({ value, options, onChange, ariaLabel, placeholder = "Choose", disabled = false, className = "" }) => {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  React.useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`app-dropdown ${className}`}>
      <button type="button" disabled={disabled} aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span>{selected?.label || placeholder}</span><ChevronDown size={14} />
      </button>
      {open && (
        <div className="app-dropdown__menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button key={option.value} type="button" role="option" aria-selected={option.value === value} data-tone={option.tone || "default"} data-value={option.value.toLowerCase().replace(/\s+/g, "-")} onClick={() => { onChange(option.value); setOpen(false); }}>
              <span>{option.label}</span>{option.value === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppDropdown;
