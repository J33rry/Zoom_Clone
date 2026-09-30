"use client";

import { CalendarPlus, ChevronDown, RotateCw } from "lucide-react";
import { useRef, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/cn";
import { formatMeetingId } from "@/lib/meetingLink";
import { formatFullRange, isSameDay, startOfDay } from "@/lib/time";
import type { Meeting } from "@/types/api";

export type MeetingsTab = "upcoming" | "recent";

interface MeetingListProps {
  tab: MeetingsTab;
  onTabChange: (tab: MeetingsTab) => void;
  meetings: Meeting[] | undefined;
  loading: boolean;
  selectedId: number | null;
  onSelect: (meeting: Meeting) => void;
  onRefresh: () => void;
  personalMeetingId?: string;
}

const referenceTime = (m: Meeting, tab: MeetingsTab) => new Date(tab === "recent" ? (m.started_at ?? m.start_time) : m.start_time);

function groupLabel(date: Date): string {
  const today = startOfDay(new Date());
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))) return "Tomorrow";
  if (isSameDay(date, new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1))) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function groupByDay(meetings: Meeting[], tab: MeetingsTab) {
  const groups: { label: string; items: Meeting[] }[] = [];
  for (const meeting of meetings) {
    const label = groupLabel(referenceTime(meeting, tab));
    const last = groups.at(-1);
    if (last?.label === label) last.items.push(meeting);
    else groups.push({ label, items: [meeting] });
  }
  return groups;
}

export function MeetingList({ tab, onTabChange, meetings, loading, selectedId, onSelect, onRefresh, personalMeetingId }: MeetingListProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex h-14 shrink-0 items-center justify-center px-4">
        <button aria-label="Refresh" onClick={onRefresh} className="absolute left-4 rounded-md p-1.5 text-ink hover:bg-hover">
          <RotateCw className="h-4 w-4" />
        </button>
        <div ref={menuRef} className="relative">
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[16px] font-semibold text-ink hover:bg-hover">
            {tab === "upcoming" ? "Upcoming" : "Recent"}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute top-9 left-1/2 z-20 w-40 -translate-x-1/2 animate-fade-in rounded-xl bg-white p-1.5 shadow-popover">
              {(["upcoming", "recent"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    onTabChange(t);
                    setMenuOpen(false);
                  }}
                  className={cn("w-full rounded-md px-3 py-2 text-left text-sm hover:bg-hover", t === tab ? "font-semibold text-zoom-blue" : "text-ink")}
                >
                  {t === "upcoming" ? "Upcoming" : "Recent"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {personalMeetingId && (
        <div className="mx-6 border-b border-line pt-2 pb-5 text-center">
          <p className="text-[22px] font-semibold tracking-[-0.01em] text-ink">{formatMeetingId(personalMeetingId)}</p>
          <p className="text-[14px] text-muted">My Personal Meeting ID (PMI)</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {loading && !meetings ? (
          <div className="flex justify-center py-10 text-zoom-blue">
            <Spinner />
          </div>
        ) : meetings && meetings.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            {tab === "upcoming" ? "No upcoming meetings" : "No recent meetings"}
          </p>
        ) : (
          groupByDay(meetings ?? [], tab).map((group) => (
            <div key={group.label}>
              <p className="px-4 pt-6 pb-3 text-[14px] font-semibold text-[#4a4f57]">{group.label}</p>
              <ul className="space-y-1">
                {group.items.map((meeting) => {
                  const selected = meeting.id === selectedId;
                  const start = referenceTime(meeting, tab);
                  const end = tab === "recent" && meeting.ended_at ? new Date(meeting.ended_at) : new Date(meeting.end_time);
                  return (
                    <li key={meeting.id}>
                      <button
                        onClick={() => onSelect(meeting)}
                        aria-current={selected}
                        className={cn(
                          "w-full rounded-xl px-5 py-4 text-left text-[14px] leading-[26px] transition-colors",
                          selected ? "bg-zoom-blue text-white" : "text-ink-2 hover:bg-hover",
                        )}
                      >
                        <p className={cn("truncate text-[17px] font-semibold", !selected && "text-ink")}>{meeting.topic}</p>
                        <p>{formatFullRange(start, end)}</p>
                        <p>Host: {meeting.host.name}</p>
                        <p>Meeting ID: {formatMeetingId(meeting.join_code)}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <button
        disabled
        title="Calendar integrations are not part of this clone"
        className="flex h-11 shrink-0 items-center justify-center gap-1.5 border-t border-line text-[15px] text-zoom-blue disabled:cursor-default"
      >
        <CalendarPlus className="h-4 w-4" /> Add a calendar
      </button>
    </div>
  );
}
