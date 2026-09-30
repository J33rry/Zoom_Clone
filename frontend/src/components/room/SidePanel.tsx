import { ChevronLeft, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SidePanelProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Host tools uses Zoom's dark panel style. */
  tone?: "light" | "dark";
  /** Shows a back chevron (sub-pages of a panel). */
  onBack?: () => void;
  headerActions?: ReactNode;
  /** Icon shown at the left of the header (when there is no back button). */
  leading?: ReactNode;
  className?: string;
}

export function SidePanel({ title, onClose, children, footer, tone = "light", onBack, headerActions, leading, className }: SidePanelProps) {
  const dark = tone === "dark";
  const iconBtn = cn("rounded p-1", dark ? "text-white/90 hover:bg-white/10" : "text-[#4a4f57] hover:bg-hover");
  return (
    <aside
      aria-label={title}
      className={cn(
        "absolute inset-0 z-30 flex animate-slide-in flex-col sm:static sm:inset-auto sm:m-1.5 sm:w-[340px] sm:shrink-0 sm:rounded-xl",
        dark ? "bg-[#1c1c1e] text-white" : "bg-white",
        className,
      )}
    >
      <header
        className={cn(
          "relative flex h-12 shrink-0 items-center justify-center px-4",
          dark ? "" : "border-b border-line",
        )}
      >
        {leading && !onBack && <span className="absolute left-3 text-white/80">{leading}</span>}
        {onBack && (
          <button aria-label="Back" onClick={onBack} className={cn(iconBtn, "absolute left-3")}>
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <h2 className={cn("text-[15px] font-semibold", dark ? "text-white" : "text-ink", !onBack && !dark && "mr-auto")}>
          {title}
        </h2>
        <div className="absolute right-3 flex items-center gap-1">
          {headerActions}
          <button aria-label={`Close ${title}`} onClick={onClose} className={iconBtn}>
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer && <footer className={cn("shrink-0 p-3", dark ? "border-t border-white/10" : "border-t border-line")}>{footer}</footer>}
    </aside>
  );
}
