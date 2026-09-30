"use client";

import { Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useRef, useState } from "react";
import { useCurrentUser } from "@/components/shell/CurrentUser";
import { JoinMeetingModal } from "@/components/meetings/JoinMeetingModal";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useStartMeeting } from "@/hooks/useStartMeeting";
import { cn } from "@/lib/cn";
import { formatMeetingId } from "@/lib/meetingLink";
import { useActiveMeeting } from "@/lib/activeMeeting";
import { BackToMeetingGlyph, JoinGlyph, NewMeetingGlyph, ScheduleGlyph } from "./TileIcons";

const PREFS_KEY = "zoom-clone:new-meeting-prefs";

interface Prefs {
  videoOn: boolean;
  usePmi: boolean;
}

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return { videoOn: true, usePmi: false };
  try {
    return { videoOn: true, usePmi: false, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") };
  } catch {
    return { videoOn: true, usePmi: false };
  }
}

function Tile({
  color,
  icon,
  label,
  onClick,
  disabled,
  trailing,
}: {
  color: "orange" | "blue";
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex w-[108px] flex-col items-center gap-2.5">
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition",
          "enabled:hover:brightness-95 enabled:active:scale-95",
          color === "orange"
            ? "bg-gradient-to-b from-zoom-orange-light to-zoom-orange"
            : "bg-gradient-to-b from-[#1f6bff] to-zoom-blue",
          // Greyed out, as Zoom does for Join while you are already in a meeting.
          disabled && "opacity-40 shadow-none",
        )}
      >
        {icon}
      </button>
      <span
        className={cn(
          "flex items-center gap-1 text-[15px] whitespace-nowrap",
          disabled ? "text-subtle" : "text-[#4a4f57]",
        )}
      >
        {label}
        {trailing}
      </span>
    </div>
  );
}

export function ActionTiles() {
  const router = useRouter();
  // While a meeting is running (minimized), the first tile returns to it and Join is disabled.
  const inMeeting = useActiveMeeting();
  const user = useCurrentUser();
  const { startInstantMeeting, starting } = useStartMeeting();
  const [joinOpen, setJoinOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Lazy init is safe for SSR: prefs only show up in the menu, which renders after a click.
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  const updatePrefs = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {}
  };

  const menuItem = "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-hover";

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {inMeeting ? (
        <Tile
          color="orange"
          icon={<BackToMeetingGlyph />}
          label="Back to Meeting"
          onClick={() => router.push(`/wc/${inMeeting.code}`)}
        />
      ) : (
        <div ref={menuRef} className="relative">
          <Tile
            color="orange"
            icon={<NewMeetingGlyph />}
            label="New meeting"
            disabled={starting}
            onClick={() => startInstantMeeting(prefs)}
            trailing={
              <button
                aria-label="New meeting options"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
                className="rounded p-0.5 hover:bg-hover"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            }
          />
          {menuOpen && (
            <div className="absolute top-[100px] left-1/2 z-30 w-[300px] -translate-x-1/2 animate-fade-in rounded-xl bg-white p-1.5 shadow-popover">
              <button className={menuItem} onClick={() => updatePrefs({ videoOn: !prefs.videoOn })}>
                <Check className={cn("h-4 w-4 text-zoom-blue", !prefs.videoOn && "invisible")} />
                Start with video
              </button>
              <button className={menuItem} onClick={() => updatePrefs({ usePmi: !prefs.usePmi })}>
                <Check className={cn("h-4 w-4 shrink-0 text-zoom-blue", !prefs.usePmi && "invisible")} />
                <span>
                  Use my Personal Meeting ID (PMI)
                  {user && (
                    <span className="block text-[13px] text-muted">{formatMeetingId(user.personal_meeting_id)}</span>
                  )}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
      <Tile color="blue" icon={<JoinGlyph />} label="Join" disabled={!!inMeeting} onClick={() => setJoinOpen(true)} />
      <Tile color="blue" icon={<ScheduleGlyph />} label="Schedule" onClick={() => router.push("/meetings/schedule")} />
      <JoinMeetingModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  );
}
