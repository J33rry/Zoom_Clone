"use client";

import {
  AlertTriangle,
  CircleEllipsis,
  DoorOpen,
  Lock,
  Heart,
  Link2,
  MessageSquare,
  Mic,
  MicOff,
  ScreenShare,
  ShieldCheck,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/cn";
import { ControlButton } from "./ControlButton";
import { REACTIONS } from "./ReactionsOverlay";

type Menu = "audio" | "video" | "participants" | "react" | "share" | "more" | "end";
export type RoomPanel = "participants" | "chat" | "host-tools";

interface ControlBarProps {
  audioOn: boolean;
  videoOn: boolean;
  sharing: boolean;
  micBlocked: boolean;
  camBlocked: boolean;
  isHost: boolean;
  /** The host's "Allow participants to …" permissions currently block this user. */
  audioLocked: boolean;
  videoLocked: boolean;
  participantCount: number;
  unreadChat: number;
  panel: RoomPanel | null;
  hidden: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleShare: () => void;
  onTogglePanel: (panel: RoomPanel) => void;
  /** Opens Host tools on its Share page. */
  onOpenShareSettings: () => void;
  /** Opens Host tools on its Participants page. */
  onOpenParticipantSettings: () => void;
  onInvite: () => void;
  onReact: (emoji: string) => void;
  onMuteAll: () => void;
  onCopyInvite: () => void;
  onLeave: () => void;
  onEndForAll: () => void;
  onMenuChange: (open: boolean) => void;
}

function Popover({ children, align = "center", className }: { children: ReactNode; align?: "center" | "left" | "right"; className?: string }) {
  return (
    <div
      className={cn(
        "absolute bottom-[calc(100%+10px)] z-40 min-w-[220px] animate-fade-in rounded-xl bg-[#2b2b2b] p-1.5 text-sm text-white shadow-panel",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "left" && "left-0",
        align === "right" && "right-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

const menuItem = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-white/10";

/** Blocked-device icon: the device glyph with Zoom's small red warning triangle. */
function Blocked({ icon }: { icon: ReactNode }) {
  return (
    <span className="relative">
      {icon}
      <AlertTriangle className="absolute -right-1.5 -bottom-1 h-3 w-3 fill-danger text-stage-bar" />
    </span>
  );
}

export function ControlBar(props: ControlBarProps) {
  const { audioOn, videoOn, sharing, micBlocked, camBlocked, isHost, audioLocked, videoLocked, participantCount, unreadChat, panel, hidden } = props;
  const [menu, setMenu] = useState<Menu | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  useClickOutside(barRef, () => setMenu(null), menu !== null);

  const { onMenuChange } = props;
  useEffect(() => {
    onMenuChange(menu !== null);
  }, [menu, onMenuChange]);

  const toggleMenu = (m: Menu) => setMenu((current) => (current === m ? null : m));
  const run = (fn: () => void) => () => {
    setMenu(null);
    fn();
  };

  const locked = (icon: ReactNode) => (
    <span className="relative">
      {icon}
      <Lock className="absolute -right-1.5 -bottom-1 h-3 w-3 text-white" />
    </span>
  );

  const audioIcon = audioLocked && !audioOn ? (
    locked(<MicOff className="h-6 w-6 text-white/50" />)
  ) : micBlocked ? (
    <Blocked icon={<MicOff className="h-6 w-6" />} />
  ) : audioOn ? (
    <Mic className="h-6 w-6" />
  ) : (
    <MicOff className="h-6 w-6 text-danger" />
  );
  const videoIcon = videoLocked && !videoOn ? (
    locked(<VideoOff className="h-6 w-6 text-white/50" />)
  ) : camBlocked ? (
    <Blocked icon={<VideoOff className="h-6 w-6" />} />
  ) : videoOn ? (
    <Video className="h-6 w-6" />
  ) : (
    <VideoOff className="h-6 w-6 text-danger" />
  );

  return (
    <div
      ref={barRef}
      className={cn(
        // @container: buttons fold into More based on the bar's own width, which shrinks when a
        // side panel is open — not just on small screens.
        "@container absolute inset-x-0 bottom-0 z-20 flex h-16 items-center justify-between bg-stage-bar px-2 transition-opacity duration-300 @min-[840px]:px-3",
        hidden && "pointer-events-none opacity-0",
      )}
    >
      <div className="flex items-center gap-0.5 @min-[600px]:gap-2">
        <div className="relative">
          <ControlButton icon={audioIcon} label={audioOn ? "Mute" : "Audio"} onClick={props.onToggleAudio} caret onCaretClick={() => toggleMenu("audio")} />
          {menu === "audio" && (
            <Popover align="left">
              <p className="px-3 py-1.5 text-[12px] text-white/60">Microphone</p>
              <p className="px-3 pb-2 text-white/90">
                {audioLocked ? "The host has disabled unmuting" : micBlocked ? "Microphone access is blocked in your browser" : "Default microphone"}
              </p>
            </Popover>
          )}
        </div>
        <div className="relative">
          <ControlButton
            icon={videoIcon}
            label={videoOn ? "Stop Video" : "Video"}
            onClick={props.onToggleVideo}
            caret
            onCaretClick={() => toggleMenu("video")}
          />
          {menu === "video" && (
            <Popover align="left">
              <p className="px-3 py-1.5 text-[12px] text-white/60">Camera</p>
              <p className="px-3 pb-2 text-white/90">
                {videoLocked ? "The host has disabled participant video" : camBlocked ? "Camera access is blocked in your browser" : "Default camera"}
              </p>
            </Popover>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 @min-[600px]:gap-2">
        <div className="relative">
          <ControlButton
            icon={<Users className="h-6 w-6" />}
            label="Participants"
            badge={participantCount}
            active={panel === "participants"}
            ariaPressed={panel === "participants"}
            onClick={() => props.onTogglePanel("participants")}
            caret
            onCaretClick={() => toggleMenu("participants")}
          />
          {menu === "participants" && (
            <Popover align="left" className="sm:right-auto sm:left-1/2 sm:-translate-x-1/2">
              <button className={menuItem} onClick={run(props.onInvite)}>
                Invite...
              </button>
              <button className={menuItem} onClick={run(props.onCopyInvite)}>
                Copy invite link
              </button>
              {isHost && (
                <button className={menuItem} onClick={run(props.onOpenParticipantSettings)}>
                  Host tools for participants
                </button>
              )}
            </Popover>
          )}
        </div>
        <ControlButton
          className="hidden @min-[480px]:flex"
          icon={<MessageSquare className="h-6 w-6" />}
          label="Chat"
          badge={unreadChat > 0 ? unreadChat : undefined}
          active={panel === "chat"}
          ariaPressed={panel === "chat"}
          onClick={() => props.onTogglePanel("chat")}
        />
        <div className="relative hidden @min-[840px]:block">
          <ControlButton icon={<Heart className="h-6 w-6" />} label="React" onClick={() => toggleMenu("react")} />
          {menu === "react" && (
            <Popover className="min-w-0">
              <div className="flex gap-1">
                {REACTIONS.map((emoji) => (
                  <button key={emoji} aria-label={`React ${emoji}`} onClick={run(() => props.onReact(emoji))} className="rounded-lg p-1.5 text-2xl hover:bg-white/10">
                    {emoji}
                  </button>
                ))}
              </div>
            </Popover>
          )}
        </div>
        <div className="relative hidden @min-[840px]:block">
          <ControlButton
            icon={<ScreenShare className={cn("h-6 w-6", sharing && "text-success")} />}
            label={sharing ? "Stop Share" : "Share"}
            active={sharing}
            onClick={props.onToggleShare}
            caret={isHost}
            onCaretClick={() => toggleMenu("share")}
          />
          {menu === "share" && (
            <Popover>
              <button className={menuItem} onClick={run(props.onOpenShareSettings)}>
                Host tools for share
              </button>
            </Popover>
          )}
        </div>
        {isHost && (
          <ControlButton
            className="hidden @min-[840px]:flex"
            icon={<ShieldCheck className="h-6 w-6" />}
            label="Host tools"
            active={panel === "host-tools"}
            ariaPressed={panel === "host-tools"}
            onClick={() => props.onTogglePanel("host-tools")}
          />
        )}
        <div className="relative">
          <ControlButton icon={<CircleEllipsis className="h-6 w-6" />} label="More" onClick={() => toggleMenu("more")} />
          {menu === "more" && (
            <Popover align="right" className="sm:right-auto sm:left-1/2 sm:-translate-x-1/2">
              <button className={menuItem} onClick={run(props.onCopyInvite)}>
                <Link2 className="h-4 w-4" /> Copy invite link
              </button>
              {/* When the bar is narrow (phones, or a side panel is open) these live in More. */}
              <div className="@min-[480px]:hidden">
                <button className={menuItem} onClick={run(() => props.onTogglePanel("chat"))}>
                  <MessageSquare className="h-4 w-4" /> Chat{unreadChat > 0 ? ` (${unreadChat})` : ""}
                </button>
              </div>
              <div className="@min-[840px]:hidden">
                <button className={menuItem} onClick={run(props.onToggleShare)}>
                  <ScreenShare className="h-4 w-4" /> {sharing ? "Stop sharing" : "Share screen"}
                </button>
                {isHost && (
                  <>
                    <button className={menuItem} onClick={run(() => props.onTogglePanel("host-tools"))}>
                      <ShieldCheck className="h-4 w-4" /> Host tools
                    </button>
                    <button className={menuItem} onClick={run(props.onMuteAll)}>
                      <MicOff className="h-4 w-4" /> Mute all participants
                    </button>
                  </>
                )}
                <div className="flex gap-1 px-2 py-1">
                  {REACTIONS.map((emoji) => (
                    <button key={emoji} aria-label={`React ${emoji}`} onClick={run(() => props.onReact(emoji))} className="rounded-lg p-1 text-xl hover:bg-white/10">
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </Popover>
          )}
        </div>
      </div>

      <div className="relative">
        <ControlButton
          icon={
            isHost ? (
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-danger">
                <X className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              </span>
            ) : (
              <DoorOpen className="h-6 w-6 text-danger" />
            )
          }
          label={isHost ? "End" : "Leave"}
          onClick={() => toggleMenu("end")}
        />
        {menu === "end" && (
          <Popover align="right" className="w-[240px] p-3">
            {isHost ? (
              <>
                <button onClick={run(props.onEndForAll)} className="w-full rounded-lg bg-danger py-2 font-semibold hover:bg-[#c71f1f]">
                  End meeting for all
                </button>
                <button onClick={run(props.onLeave)} className="mt-2 w-full rounded-lg bg-white/10 py-2 font-semibold hover:bg-white/15">
                  Leave meeting
                </button>
              </>
            ) : (
              <button onClick={run(props.onLeave)} className="w-full rounded-lg bg-danger py-2 font-semibold hover:bg-[#c71f1f]">
                Leave meeting
              </button>
            )}
          </Popover>
        )}
      </div>
    </div>
  );
}
