import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        primary: "bg-[#1A1208] text-[#FAF7F2] hover:bg-[#2D2417] active:bg-[#0D0A04]",
        secondary: "bg-[#F5F0E8] text-[#1A1208] hover:bg-[#EDE5D8] border border-[#E8E0D4]",
        ghost: "text-[#1A1208] hover:bg-[#F5F0E8] active:bg-[#EDE5D8]",
        danger: "bg-[#991B1B] text-white hover:bg-[#7F1D1D]",
        accent: "bg-[#C4973A] text-white hover:bg-[#A97E2A]",
        outline: "bg-transparent text-white border border-white/30 hover:bg-white/10",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
        md: "h-11 px-5 text-sm rounded-xl gap-2",
        lg: "h-13 px-6 text-base rounded-xl gap-2",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : null}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
