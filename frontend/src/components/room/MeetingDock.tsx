"use client";

import { usePathname } from "next/navigation";
import { activeMeeting, useActiveMeeting } from "@/lib/activeMeeting";
import { cn } from "@/lib/cn";
import { MeetingRoom } from "./MeetingRoom";

/**
 * Renders the active meeting once, above every route, so navigating never drops the call.
 * On /wc/<code> it fills the meeting stage; anywhere else it shrinks to Zoom's mini window.
 * Only the wrapper's position changes, so MeetingRoom (socket, WebRTC, media) stays mounted.
 */
export function MeetingDock() {
  const active = useActiveMeeting();
  const pathname = usePathname();
  if (!active) return null;

  const full = pathname === `/wc/${active.code}`;
  const isHost = active.session.role === "host";

  return (
    <div
      className={cn(
        "fixed z-40 overflow-hidden bg-stage",
        full
          ? isHost
            ? // Inside the Workplace chrome: below the 60px top bar, right of the 78px side rail.
              "inset-x-0 top-[60px] bottom-0 md:right-1.5 md:bottom-1.5 md:left-[78px] md:rounded-xl"
            : "inset-0"
          : "right-4 bottom-20 h-[144px] w-[256px] rounded-lg border border-white/10 shadow-panel md:bottom-4",
      )}
    >
      <MeetingRoom
        key={active.session.participantId}
        code={active.code}
        session={active.session}
        mode={full ? "full" : "mini"}
        onExit={activeMeeting.clear}
      />
    </div>
  );
}
