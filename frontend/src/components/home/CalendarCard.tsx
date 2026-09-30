"use client";

import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { MiniCalendar } from "@/components/calendar/MiniCalendar";
import { Spinner } from "@/components/ui/Spinner";
import { useAsync } from "@/hooks/useAsync";
import { useClickOutside } from "@/hooks/useClickOutside";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { addDays, formatRelativeDay, isSameDay, startOfDay } from "@/lib/time";
import type { Meeting } from "@/types/api";
import { DayMeetingCard } from "./DayMeetingCard";
import { EmptyState } from "./EmptyState";

interface CalendarCardProps {
  selectedMeetingId: number | null;
  onSelectMeeting: (meeting: Meeting) => void;
  /** Bumped by the parent to force a refetch (e.g. after a delete). */
  refreshKey: number;
}

/** The day-view card on Home: date picker header, Today/‹/› toolbar, that day's meetings. */
export function CalendarCard({ selectedMeetingId, onSelectMeeting, refreshKey }: CalendarCardProps) {
  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(pickerRef, () => setPickerOpen(false), pickerOpen);
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  const { data: meetings, loading, error, reload } = useAsync(
    () => api.meetingsBetween(day, addDays(day, 1)),
    [day.getTime(), refreshKey],
  );

  const today = startOfDay(new Date());
  const isToday = isSameDay(day, today);
  const TodayIcon = isToday ? CalendarDays : day > today ? ArrowLeft : ArrowRight;
  const iconBtn = "flex h-8 w-8 items-center justify-center rounded-md text-[#4a4f57] hover:bg-hover";

  return (
    <section aria-label="Meetings calendar" className="rounded-2xl border border-line-strong/70 bg-white">
      <header ref={pickerRef} className="relative flex h-[52px] items-center justify-center border-b border-line px-4">
        <button
          onClick={() => setPickerOpen((o) => !o)}
          aria-expanded={pickerOpen}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[16px] font-semibold text-ink hover:bg-hover",
            pickerOpen && "bg-hover",
          )}
        >
          {formatRelativeDay(day)}
          <ChevronDown className={cn("h-4 w-4 transition-transform", pickerOpen && "rotate-180")} />
        </button>
        <Link href="/meetings" aria-label="Open meetings" className={cn(iconBtn, "absolute right-4")}>
          <ExternalLink className="h-4 w-4" />
        </Link>
        {pickerOpen && (
          <div className="absolute top-[52px] left-1/2 z-30 -translate-x-1/2 animate-fade-in rounded-2xl border border-line bg-white p-5 shadow-popover">
            <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-t border-l border-line bg-white" />
            <MiniCalendar
              value={day}
              onChange={(d) => {
                setDay(startOfDay(d));
                setPickerOpen(false);
              }}
            />
          </div>
        )}
      </header>

      <div className="flex h-[50px] items-center gap-1 border-b border-line px-4">
        <button
          onClick={() => setDay(today)}
          className="mr-2 flex h-7 items-center gap-1.5 rounded-full border border-[#8f97a3] px-2.5 text-[13px] text-ink hover:bg-hover"
        >
          <TodayIcon className="h-3.5 w-3.5" />
          Today
        </button>
        <button aria-label="Previous day" onClick={() => setDay((d) => addDays(d, -1))} className={iconBtn}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button aria-label="Next day" onClick={() => setDay((d) => addDays(d, 1))} className={iconBtn}>
          <ChevronRight className="h-4 w-4" />
        </button>
        <div ref={menuRef} className="relative ml-auto">
          <button aria-label="More options" onClick={() => setMenuOpen((o) => !o)} className={iconBtn}>
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute top-9 right-0 z-30 w-48 animate-fade-in rounded-xl bg-white p-1.5 shadow-popover">
              <button
                className="w-full rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-hover"
                onClick={() => {
                  reload();
                  setMenuOpen(false);
                }}
              >
                Refresh
              </button>
              <Link href="/meetings/schedule" className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-hover">
                Schedule a meeting
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-[300px] space-y-3 p-4">
        {loading && !meetings ? (
          <div className="flex h-[260px] items-center justify-center text-zoom-blue">
            <Spinner />
          </div>
        ) : error ? (
          <EmptyState text={error.message} />
        ) : meetings && meetings.length > 0 ? (
          meetings.map((meeting) => (
            <DayMeetingCard
              key={meeting.id}
              meeting={meeting}
              selected={meeting.id === selectedMeetingId}
              onSelect={() => onSelectMeeting(meeting)}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}
