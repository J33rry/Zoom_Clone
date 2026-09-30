import { cn } from "@/lib/cn";
import { formatCompactRange, formatRelativeDay } from "@/lib/time";
import type { Meeting } from "@/types/api";

interface DayMeetingCardProps {
  meeting: Meeting;
  selected: boolean;
  onSelect: () => void;
}

export function DayMeetingCard({ meeting, selected, onSelect }: DayMeetingCardProps) {
  const start = new Date(meeting.start_time);
  const end = new Date(meeting.end_time);
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-left transition-colors",
        selected ? "border-zoom-blue bg-zoom-blue-soft/40" : "border-line-strong hover:bg-hover",
      )}
    >
      <div className="flex items-center gap-2">
        <p className="truncate text-[17px] font-semibold text-ink">{meeting.topic}</p>
        {meeting.status === "live" && (
          <span className="shrink-0 rounded bg-success/10 px-1.5 py-0.5 text-[11px] font-semibold text-success">
            In progress
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[15px] text-ink-2">{formatRelativeDay(start)}</p>
      <p className="text-[15px] text-ink-2">{formatCompactRange(start, end)}</p>
      <p className="mt-0.5 text-[15px] text-ink-2">Host: {meeting.host.name}</p>
    </button>
  );
}
