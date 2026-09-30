"use client";

import { History } from "lucide-react";
import Link from "next/link";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { formatMeetingId } from "@/lib/meetingLink";
import { formatClock, formatRelativeDay } from "@/lib/time";
import type { Meeting } from "@/types/api";

interface RecentMeetingsProps {
  onSelectMeeting: (meeting: Meeting) => void;
  refreshKey: number;
}

const LIMIT = 4;

export function RecentMeetings({ onSelectMeeting, refreshKey }: RecentMeetingsProps) {
  const { data: meetings } = useAsync(() => api.recent(), [refreshKey]);
  if (!meetings || meetings.length === 0) return null;

  return (
    <section aria-label="Recent meetings" className="mt-6">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <History className="h-4 w-4 text-[#4a4f57]" />
          Recent meetings
        </h2>
        <Link href="/meetings?tab=recent" className="text-[13px] text-zoom-blue hover:underline">
          View all
        </Link>
      </div>
      <ul className="divide-y divide-line rounded-2xl border border-line-strong/70">
        {meetings.slice(0, LIMIT).map((meeting) => {
          const started = new Date(meeting.started_at ?? meeting.start_time);
          return (
            <li key={meeting.id}>
              <button
                onClick={() => onSelectMeeting(meeting)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left first:rounded-t-2xl last:rounded-b-2xl hover:bg-hover"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-ink">{meeting.topic}</p>
                  <p className="text-[13px] text-muted">
                    {formatRelativeDay(started)} · {formatClock(started)}
                  </p>
                </div>
                <span className="shrink-0 text-[13px] text-muted">{formatMeetingId(meeting.join_code)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
