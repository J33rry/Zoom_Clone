import { ChevronDown } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const FIELD =
  "h-10 w-full rounded-lg border border-line-strong bg-white px-3.5 text-[15px] text-ink outline-none transition-colors " +
  "placeholder:text-subtle hover:border-[#aeb4bd] focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/15 " +
  "disabled:bg-[#f7f8fa] disabled:text-subtle";

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD, className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn(FIELD, "appearance-none pr-10")} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-ink" />
    </div>
  );
}

interface ChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export function Checkbox({ label, className, ...props }: ChoiceProps) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-[15px] text-ink", className)}>
      <input type="checkbox" className="h-[18px] w-[18px] cursor-pointer rounded accent-zoom-blue" {...props} />
      {label}
    </label>
  );
}

export function Radio({ label, className, ...props }: ChoiceProps) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-[15px] text-ink", className)}>
      <input type="radio" className="h-[18px] w-[18px] cursor-pointer accent-zoom-blue" {...props} />
      {label}
    </label>
  );
}
