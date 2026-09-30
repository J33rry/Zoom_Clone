import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-zoom-blue text-white hover:bg-zoom-blue-hover disabled:bg-[#e8eaee] disabled:text-subtle",
  // Soft grey with blue text: "Cancel", "Close"
  secondary: "bg-[#eef0f3] text-zoom-blue hover:bg-[#e3e6ea] disabled:text-subtle",
  // White with a border: "Copy Invitation", "Edit", "Delete"
  outline: "border border-line-strong bg-white text-ink hover:bg-hover",
  ghost: "text-zoom-blue hover:bg-zoom-blue-soft",
  danger: "bg-danger text-white hover:bg-[#c71f1f]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zoom-blue",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
