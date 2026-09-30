"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { isSameDay, startOfDay } from "@/lib/time";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

interface MiniCalendarProps {
  value: Date;
  onChange: (date: Date) => void;
  /** Days before this are disabled (used by the Schedule form). */
  minDate?: Date;
}

/** Month grid used by the Home date picker and the Schedule form's date field. */
export function MiniCalendar({ value, onChange, minDate }: MiniCalendarProps) {
  const [month, setMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const today = new Date();

  const gridStart = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay());
  const days = Array.from({ length: 42 }, (_, i) =>
    new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i),
  );
  const shift = (months: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + months, 1));
  const navBtn = "flex h-7 w-7 items-center justify-center rounded-md text-ink hover:bg-hover";

  return (
    <div className="w-[292px] select-none">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex">
          <button className={navBtn} aria-label="Previous year" onClick={() => shift(-12)}>
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button className={navBtn} aria-label="Previous month" onClick={() => shift(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <span className="text-[15px] font-semibold text-ink">
          {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <div className="flex">
          <button className={navBtn} aria-label="Next month" onClick={() => shift(1)}>
            <ChevronRight className="h-4 w-4" />
          </button>
          <button className={navBtn} aria-label="Next year" onClick={() => shift(12)}>
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="pb-1.5 text-[13px] text-muted">
            {d}
          </span>
        ))}
        {days.map((day) => {
          const outside = day.getMonth() !== month.getMonth();
          const selected = isSameDay(day, value);
          const isToday = isSameDay(day, today);
          const disabled = !!minDate && day < startOfDay(minDate);
          return (
            <button
              key={day.toISOString()}
              disabled={disabled}
              onClick={() => onChange(day)}
              aria-pressed={selected}
              className={cn(
                "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[15px] transition-colors",
                outside || disabled ? "text-subtle" : "text-ink",
                !selected && !disabled && "hover:bg-hover",
                selected && "border border-zoom-blue bg-zoom-blue-soft font-semibold text-zoom-blue",
                !selected && isToday && "font-semibold text-zoom-blue",
                disabled && "opacity-50",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
