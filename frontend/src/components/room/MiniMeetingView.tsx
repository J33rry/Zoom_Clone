"use client";

import { DoorOpen, Maximize2, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { type StageParticipant } from "./VideoGrid";
import { VideoTile } from "./VideoTile";

interface MiniMeetingViewProps {
  speaker: StageParticipant | undefined;
  hideProfilePictures: boolean;
  audioOn: boolean;
  videoOn: boolean;
  statusText?: string;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onExpand: () => void;
  onLeave: () => void;
}

/** Zoom's minimized meeting window: the active speaker, with controls on hover. */
export function MiniMeetingView(props: MiniMeetingViewProps) {
  const { speaker, audioOn, videoOn } = props;
  const btn = "flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black";

  return (
    <div
      className="group relative h-full w-full bg-black"
      onDoubleClick={props.onExpand}
      role="region"
      aria-label="Minimized meeting"
    >
      {speaker ? (
        <VideoTile {...speaker} solo hideProfilePicture={props.hideProfilePictures} />
      ) : (
        <p className="flex h-full items-center justify-center px-4 text-center text-sm text-white/70">
          {props.statusText ?? "Connecting…"}
        </p>
      )}

      <div className="absolute inset-0 flex flex-col justify-between bg-black/30 p-1.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <div className="flex justify-end">
          <button aria-label="Back to meeting" title="Back to meeting" onClick={props.onExpand} className={btn}>
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-center gap-2">
          <button aria-label={audioOn ? "Mute" : "Unmute"} onClick={props.onToggleAudio} className={btn}>
            {audioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4 text-danger" />}
          </button>
          <button aria-label={videoOn ? "Stop Video" : "Start Video"} onClick={props.onToggleVideo} className={btn}>
            {videoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4 text-danger" />}
          </button>
          <button aria-label="Leave meeting" onClick={props.onLeave} className={cn(btn, "bg-danger hover:bg-[#c71f1f]")}>
            <DoorOpen className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
