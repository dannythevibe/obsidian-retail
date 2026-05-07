"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent",
        "transition-colors duration-150 focus-visible:outline-none",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        checked ? "bg-[#1A1208]" : "bg-[#E8E0D4]"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm",
          "transition-transform duration-150",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
      {label && <span className="sr-only">{label}</span>}
    </button>
  );
}
