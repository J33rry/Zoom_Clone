import { ChevronUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ControlButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  badge?: number | string;
  /** Renders the small ^ caret next to the icon (Audio, Video, Participants…). */
  caret?: boolean;
  onCaretClick?: () => void;
  className?: string;
  ariaPressed?: boolean;
}

/**
 * One meeting control, sized uniformly like Zoom's bar (narrower when the bar itself is narrow;
 * widths are container queries on the control bar). The icon, label and caret share a single
 * hover box; the caret also gets its own lighter highlight.
 */
export function ControlButton({ icon, label, onClick, active, badge, caret, onCaretClick, className, ariaPressed }: ControlButtonProps) {
  return (
    <div className={cn("relative flex rounded-lg transition-colors hover:bg-white/10", className)}>
      <button
        onClick={onClick}
        aria-label={label}
        aria-pressed={ariaPressed}
        className={cn(
          "flex min-w-[68px] flex-col items-center gap-1 rounded-lg px-2 pt-1.5 pb-1 text-[12px] text-white/90 outline-none @min-[600px]:min-w-[84px]",
          "focus-visible:ring-2 focus-visible:ring-white/40",
          active && "text-[#6ea8ff]",
        )}
      >
        <span className="relative flex h-6 items-center">
          {icon}
          {badge !== undefined && badge !== 0 && (
            <span className="absolute -top-1 left-[calc(100%+2px)] text-[11px] leading-none text-white/75">{badge}</span>
          )}
        </span>
        <span className="whitespace-nowrap">{label}</span>
      </button>
      {caret && (
        <button
          aria-label={`${label} options`}
          onClick={onCaretClick}
          className="absolute top-1.5 right-0.5 hidden h-6 w-5 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/15 hover:text-white @min-[480px]:flex"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
