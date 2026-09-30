"use client";

import { AlignJustify, ChevronDown, ChevronRight, Clock3, Copy, Link2, MapPin, Users, Video, X } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { InvitationText } from "@/components/meetings/InvitationText";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useStartMeeting } from "@/hooks/useStartMeeting";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatMeetingId } from "@/lib/meetingLink";
import { formatDetailWhen } from "@/lib/time";
import type { Meeting, MeetingAttendee } from "@/types/api";

interface MeetingDetailsPanelProps {
  meeting: Meeting;
  onClose: () => void;
}

const canStart = (m: Meeting) => !(m.meeting_type === "instant" && m.status === "ended");

/** Zoom draws people outside the account ("External") with a pink avatar. */
const EXTERNAL_COLOR = "#f7a3ae";
const colorOf = (a: MeetingAttendee) => (a.is_guest ? EXTERNAL_COLOR : a.avatar_color);

/** The grey circular copy button used throughout the panel. */
function CopyButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1f2f4] text-ink hover:bg-[#e3e6ea]", className)}
    >
      <Copy className="h-4 w-4" />
    </button>
  );
}

function JoinInfoRow({ label, value, onCopy, children }: { label: string; value: string; onCopy: () => void; children?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <p className="min-w-0 truncate text-[16px] text-ink">
        {label}: {children ?? value}
      </p>
      <CopyButton label={`Copy ${label.toLowerCase()}`} onClick={onCopy} />
    </div>
  );
}

/** Collapsed: "N participants" with the host, a divider and the others' stacked avatars. Expanded: the full list. */
function ParticipantsSection({ attendees, onCopy }: { attendees: MeetingAttendee[]; onCopy: (text: string, what: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const host = attendees.filter((a) => a.role === "host");
  const others = attendees.filter((a) => a.role !== "host");
  const count = attendees.length;
  const shown = others.slice(0, 6);

  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <button onClick={() => setExpanded((e) => !e)} className="flex-1 text-left text-[16px] text-ink">
          {count} {count === 1 ? "participant" : "participants"}
        </button>
        {expanded && (
          <CopyButton
            label="Copy participant names"
            onClick={() => onCopy(attendees.map((a) => a.name).join(", "), "Participant names")}
            className="bg-transparent hover:bg-hover"
          />
        )}
        <button
          aria-label={expanded ? "Collapse participants" : "Expand participants"}
          aria-expanded={expanded}
          onClick={() => setExpanded((e) => !e)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-hover",
            expanded && "ring-2 ring-zoom-blue",
          )}
        >
          {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>

      {expanded ? (
        <ul className="mt-3 space-y-3">
          {attendees.map((a, i) => (
            <li key={`${i}-${a.name}`} className="group flex items-center gap-3">
              <Avatar name={a.name} color={colorOf(a)} size={28} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] text-ink">
                  {a.name}
                  {a.role === "host" && " (Host)"}
                </p>
                {(a.is_guest || a.in_meeting) && (
                  <p className="flex flex-wrap items-center gap-x-1 text-[13px] text-ink-2">
                    {a.is_guest && (
                      <>
                        <span>External</span>
                        <span className="h-3 w-px bg-ink-2" />
                        <span>Not invited before meeting</span>
                      </>
                    )}
                    {a.in_meeting && (
                      <>
                        {a.is_guest && <span className="h-3 w-px bg-ink-2" />}
                        <span className="text-success">In meeting</span>
                      </>
                    )}
                  </p>
                )}
              </div>
              <CopyButton
                label={`Copy ${a.name}`}
                onClick={() => onCopy(a.name, "Name")}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 flex items-center">
          {host.map((a, i) => (
            <Avatar key={i} name={a.name} color={colorOf(a)} size={28} />
          ))}
          {host.length > 0 && others.length > 0 && <span className="mx-2.5 h-7 w-px bg-line" />}
          {shown.map((a, i) => (
            <Avatar key={`${i}-${a.name}`} name={a.name} color={colorOf(a)} size={28} className={cn("rounded-[28%] ring-2 ring-white", i > 0 && "-ml-1.5")} />
          ))}
          {others.length > shown.length && <span className="ml-2 text-[14px] text-ink-2">+{others.length - shown.length}</span>}
        </div>
      )}
    </div>
  );
}

/** Slide-over shown when a meeting card on the Home calendar is clicked. */
export function MeetingDetailsPanel({ meeting, onClose }: MeetingDetailsPanelProps) {
  const { startMeeting, starting } = useStartMeeting();
  const toast = useToast();
  const [linkExpanded, setLinkExpanded] = useState(false);
  const [showJoinInfo, setShowJoinInfo] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  // Clicking anywhere outside the panel (or pressing Escape) closes it, as in Zoom.
  useClickOutside(panelRef, onClose);
  const { data: attendees } = useAsync(() => api.participants(meeting.id), [meeting.id]);
  const anyoneJoined = !!attendees?.some((a) => a.role !== "host");

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${what} copied to clipboard`);
    } catch {
      toast("Could not access the clipboard", "error");
    }
  };

  const row = "flex gap-4 border-line py-4";
  const iconCls = "mt-0.5 h-5 w-5 shrink-0 text-[#4a4f57]";

  return (
    <aside
      ref={panelRef}
      aria-label={`${meeting.topic} details`}
      className="absolute inset-y-3 right-3 z-20 flex w-[min(440px,calc(100%-24px))] animate-slide-in flex-col rounded-2xl bg-white shadow-panel"
    >
      <div className="flex justify-end px-4 pt-4">
        <button aria-label="Close" onClick={onClose} className="rounded-md p-1.5 text-[#4a4f57] hover:bg-hover">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <h2 className="text-[24px] font-semibold tracking-[-0.01em] text-ink">{meeting.topic}</h2>

        <div className="mt-4 flex gap-4">
          <Clock3 className={iconCls} />
          <p className="text-[16px] text-ink">
            {formatDetailWhen(new Date(meeting.start_time), new Date(meeting.end_time))}
          </p>
        </div>

        <div className="mt-4 flex gap-4">
          <Video className={cn(iconCls, "mt-2.5")} />
          <div className="min-w-0 flex-1">
            {canStart(meeting) && (
              <button
                onClick={() => startMeeting(meeting)}
                disabled={starting}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#eef0f3] px-4 text-[16px] font-medium text-ink hover:bg-[#e3e6ea] disabled:opacity-60"
              >
                <Video className="h-5 w-5 fill-zoom-blue text-zoom-blue" />
                Start
              </button>
            )}
          </div>
        </div>

        {showJoinInfo && (
          <div className="mt-3 flex gap-4">
            <Link2 className={cn(iconCls, "mt-1.5")} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <JoinInfoRow label="Invite link" value={meeting.invite_link} onCopy={() => copy(meeting.invite_link, "Invite link")}>
                <a href={meeting.invite_link} className="text-zoom-blue hover:underline">
                  {meeting.invite_link}
                </a>
              </JoinInfoRow>
              <JoinInfoRow
                label="Meeting ID"
                value={formatMeetingId(meeting.join_code)}
                onCopy={() => copy(meeting.join_code, "Meeting ID")}
              />
              {meeting.passcode && (
                <JoinInfoRow label="Passcode" value={meeting.passcode} onCopy={() => copy(meeting.passcode ?? "", "Passcode")} />
              )}
            </div>
          </div>
        )}
        <button
          onClick={() => setShowJoinInfo((s) => !s)}
          className={cn("ml-9 block text-[16px] text-zoom-blue hover:underline", showJoinInfo ? "mt-3" : "mt-2")}
        >
          {showJoinInfo ? "Hide join info" : "View join info"}
        </button>

        <div className={cn(row, "mt-4 border-t")}>
          <MapPin className={iconCls} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <a
                href={meeting.invite_link}
                className={cn("min-w-0 flex-1 text-[15px] text-zoom-blue hover:underline", linkExpanded ? "break-all" : "truncate")}
              >
                {meeting.invite_link}
              </a>
              <button
                aria-label={linkExpanded ? "Collapse link" : "Expand link"}
                onClick={() => setLinkExpanded((e) => !e)}
                className="rounded p-1 hover:bg-hover"
              >
                <ChevronDown className={cn("h-4 w-4 text-ink transition-transform", linkExpanded && "rotate-180")} />
              </button>
            </div>
          </div>
        </div>

        <div className={cn(row, "border-t")}>
          <Users className={iconCls} />
          {attendees && anyoneJoined ? (
            <ParticipantsSection attendees={attendees} onCopy={copy} />
          ) : (
            <div className="flex-1">
              <p className="text-[16px] text-ink">Invitees</p>
              <div className="mt-4 flex items-center gap-3">
                <Avatar name={meeting.host.name} color={meeting.host.avatar_color} size={40} />
                <span className="text-[16px] text-ink">{meeting.host.name} (Host)</span>
              </div>
            </div>
          )}
        </div>

        <div className={cn(row, "border-t")}>
          <AlignJustify className={iconCls} />
          <div className="min-w-0 flex-1">
            <p className="text-[16px] text-ink">Description</p>
            {meeting.description && <p className="mt-3 text-[15px] whitespace-pre-line text-ink-2">{meeting.description}</p>}
            <div className="mt-6 mb-5 h-px w-44 bg-ink-2" />
            <InvitationText text={meeting.invitation} className="text-[15px] leading-6 text-ink-2" />
            <div className="mt-5 h-px w-44 bg-ink-2" />
          </div>
        </div>
      </div>
    </aside>
  );
}
