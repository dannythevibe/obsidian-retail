import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "bestseller" | "sale" | "outofstock" | "paid" | "pending" | "failed" | "new";

const styles: Record<BadgeVariant, string> = {
  default:    "bg-[#F5F0E8] text-[#7A6E62] border border-[#E8E0D4]",
  bestseller: "bg-[#1A1208] text-[#FAF7F2]",
  sale:       "bg-[#C4973A] text-white",
  outofstock: "bg-[#E8E0D4] text-[#7A6E62]",
  paid:       "bg-[#DCFCE7] text-[#2D6A4F]",
  pending:    "bg-[#FEF3C7] text-[#B45309]",
  failed:     "bg-[#FEE2E2] text-[#991B1B]",
  new:        "bg-[#F0F9FF] text-[#0369A1]",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
