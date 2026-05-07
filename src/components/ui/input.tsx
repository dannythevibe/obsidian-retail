import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, prefix, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#1A1208]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3.5 text-[#7A6E62] text-sm select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-11 bg-white border border-[#E8E0D4] rounded-xl text-sm text-[#1A1208]",
              "placeholder:text-[#B0A89E] outline-none transition-colors",
              "focus:border-[#1A1208] focus:ring-2 focus:ring-[#1A1208]/8",
              error && "border-[#991B1B] focus:border-[#991B1B] focus:ring-[#991B1B]/10",
              prefix ? "pl-8 pr-4" : "px-4",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[#991B1B]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#7A6E62]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
