"use client";

import { Check, Copy, Info, LayoutGrid, Maximize2, Minimize2, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/cn";
import { formatMeetingId } from "@/lib/meetingLink";
import type { Meeting } from "@/types/api";
import type { RoomView } from "./VideoGrid";

interface RoomHeaderProps {
  meeting: Meeting | undefined;
  hidden: boolean;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onCopyInvite: () => void;
  view: RoomView;
  onViewChange: (view: RoomView) => void;
}

export function RoomHeader({ meeting, hidden, fullscreen, onToggleFullscreen, onCopyInvite, view, onViewChange }: RoomHeaderProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  useClickOutside(infoRef, () => setInfoOpen(false), infoOpen);
  useClickOutside(viewRef, () => setViewOpen(false), viewOpen);

  const title = meeting ? (meeting.meeting_type === "scheduled" ? meeting.topic : `${meeting.host.name}'s Zoom Meeting`) : "";
  const iconBtn = "rounded-md p-1.5 text-white/90 hover:bg-white/10";

  return (
    <div
      className={cn(
        "absolute inset-x-0 top-0 z-20 flex h-12 items-center gap-2 bg-stage-bar px-3 text-white transition-opacity duration-300",
        hidden && !infoOpen && !viewOpen && "pointer-events-none opacity-0",
      )}
    >
      <div ref={infoRef} className="relative flex min-w-0 items-center gap-2">
        <button aria-label="Meeting information" onClick={() => setInfoOpen((o) => !o)} className={iconBtn}>
          <Info className="h-4 w-4" />
        </button>
        <span className="truncate text-[13px] font-semibold">{title}</span>
        {infoOpen && meeting && (
          <div className="absolute top-10 left-0 z-40 w-[min(360px,calc(100vw-32px))] animate-fade-in rounded-xl bg-white p-5 text-ink shadow-panel">
            <p className="text-[16px] font-semibold">{title}</p>
            <dl className="mt-4 grid grid-cols-[100px_1fr] gap-y-2.5 text-[13px]">
              <dt className="text-muted">Meeting ID</dt>
              <dd>{formatMeetingId(meeting.join_code)}</dd>
              <dt className="text-muted">Host</dt>
              <dd>{meeting.host.name}</dd>
              {meeting.passcode && (
                <>
                  <dt className="text-muted">Passcode</dt>
                  <dd>{meeting.passcode}</dd>
                </>
              )}
              <dt className="text-muted">Invite link</dt>
              <dd className="min-w-0">
                <span className="block truncate text-zoom-blue">{meeting.invite_link}</span>
                <button onClick={onCopyInvite} className="mt-1.5 inline-flex items-center gap-1 font-semibold text-zoom-blue hover:underline">
                  <Copy className="h-3.5 w-3.5" /> Copy link
                </button>
              </dd>
              <dt className="text-muted">Encryption</dt>
              <dd className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 fill-success text-white" /> Enabled
              </dd>
            </dl>
          </div>
        )}
      </div>
      <div className="ml-auto flex items-center gap-1">
        <span title="This meeting is encrypted" className="p-1.5">
          <ShieldCheck className="h-[18px] w-[18px] fill-success text-stage-bar" />
        </span>
        <span className="mx-1 h-5 w-px bg-white/20" />
        <div ref={viewRef} className="relative">
          <button aria-label="View" aria-expanded={viewOpen} onClick={() => setViewOpen((o) => !o)} className={iconBtn}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          {viewOpen && (
            <div className="absolute top-9 right-0 z-40 w-44 animate-fade-in rounded-xl bg-[#2b2b2b] p-1.5 text-sm shadow-panel">
              {(["speaker", "gallery"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onViewChange(option);
                    setViewOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-white/10"
                >
                  <Check className={cn("h-4 w-4", view !== option && "invisible")} />
                  {option === "speaker" ? "Speaker View" : "Gallery View"}
                </button>
              ))}
            </div>
          )}
        </div>
        <button aria-label={fullscreen ? "Exit full screen" : "Full screen"} onClick={onToggleFullscreen} className={iconBtn}>
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
