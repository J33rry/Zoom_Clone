"use client";

import { MicOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { PeerInfo } from "@/types/api";

interface VideoTileProps {
  peer: PeerInfo;
  /** Video to render; audio is played separately by <RemoteAudio>. */
  videoTrack: MediaStreamTrack | null;
  isSelf: boolean;
  /** Solo tiles blend into the stage, as in the single-participant design. */
  solo?: boolean;
  /** Host tools "Hide profile pictures": show the name instead of the avatar. */
  hideProfilePicture?: boolean;
  className?: string;
}

export function VideoTile({ peer, videoTrack, isSelf, solo, hideProfilePicture, className }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const showVideo = !!videoTrack && (peer.video_on || peer.sharing);
  // Guests have no profile picture, and the host can hide pictures: show the name instead.
  const showName = !!hideProfilePicture || peer.is_guest;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = showVideo && videoTrack ? new MediaStream([videoTrack]) : null;
  }, [videoTrack, showVideo]);

  return (
    <div
      className={cn(
        "@container relative flex items-center justify-center overflow-hidden",
        solo ? "h-full w-full" : "aspect-video w-full rounded-lg bg-stage-2",
        className,
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "absolute inset-0 h-full w-full",
          peer.sharing ? "object-contain" : "object-cover",
          isSelf && !peer.sharing && "-scale-x-100",
          !showVideo && "hidden",
        )}
      />
      {!showVideo && showName && (
        <span className="max-w-[80%] truncate text-[clamp(16px,6cqw,32px)] font-medium text-white">{peer.name}</span>
      )}
      {!showVideo && !showName && (
        <span
          className="flex aspect-square w-[22cqw] max-w-[96px] min-w-[44px] items-center justify-center text-[clamp(20px,11cqw,52px)] text-white"
          style={{ backgroundColor: peer.avatar_color }}
          aria-hidden
        >
          {peer.name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="absolute bottom-1.5 left-1.5 flex max-w-[85%] items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[12px] text-white">
        {peer.audio_muted && <MicOff className="h-3 w-3 shrink-0 text-danger" aria-label="Muted" />}
        <span className="truncate">{peer.name}</span>
      </span>
    </div>
  );
}
