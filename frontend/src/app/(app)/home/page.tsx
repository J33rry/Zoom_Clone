"use client";

import { useState } from "react";
import { ActionTiles } from "@/components/home/ActionTiles";
import { CalendarCard } from "@/components/home/CalendarCard";
import { Clock } from "@/components/home/Clock";
import { MeetingDetailsPanel } from "@/components/home/MeetingDetailsPanel";
import { RecentMeetings } from "@/components/home/RecentMeetings";
import type { Meeting } from "@/types/api";

export default function HomePage() {
  const [selected, setSelected] = useState<Meeting | null>(null);

  return (
    <div className="relative h-full">
      <div className="h-full overflow-y-auto px-4 pb-10">
        <div className="mx-auto max-w-[590px] pt-10 sm:pt-14">
          <Clock />
          <div className="mt-8">
            <ActionTiles />
          </div>
          <div className="mt-7">
            <CalendarCard selectedMeetingId={selected?.id ?? null} onSelectMeeting={setSelected} refreshKey={0} />
          </div>
          <RecentMeetings onSelectMeeting={setSelected} refreshKey={0} />
        </div>
      </div>
      {selected && <MeetingDetailsPanel key={selected.id} meeting={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
