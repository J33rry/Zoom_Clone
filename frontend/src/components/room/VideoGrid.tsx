"use client";

import type { PeerInfo } from "@/types/api";
import { VideoTile } from "./VideoTile";

export interface StageParticipant {
  peer: PeerInfo;
  videoTrack: MediaStreamTrack | null;
  isSelf: boolean;
}

export type RoomView = "speaker" | "gallery";

function columnsFor(count: number): number {
  if (count <= 1) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
}

/** Who gets the big stage in speaker view: a screen share, else the host, else anyone but me. */
export function pickSpeaker(participants: StageParticipant[]): StageParticipant {
  return (
    participants.find((p) => p.peer.sharing && p.videoTrack) ??
    participants.find((p) => !p.isSelf && p.peer.role === "host") ??
    participants.find((p) => !p.isSelf) ??
    participants[0]
  );
}

interface VideoGridProps {
  participants: StageParticipant[];
  view: RoomView;
  hideProfilePictures?: boolean;
}

/**
 * Speaker view (Zoom's default): one participant on the stage, everyone else in a
 * thumbnail strip along the top. Gallery view: an even grid. A screen share always
 * takes the stage.
 */
export function VideoGrid({ participants: raw, view, hideProfilePictures = false }: VideoGridProps) {
  const participants = raw.map((p) => ({ ...p, hideProfilePicture: hideProfilePictures }));

  if (participants.length === 1) {
    return <VideoTile {...participants[0]} solo />;
  }

  const presenter = participants.find((p) => p.peer.sharing && p.videoTrack);
  if (view === "speaker" || presenter) {
    const speaker = presenter ?? pickSpeaker(participants);
    const strip = participants.filter((p) => p !== speaker);
    return (
      <div className="flex h-full w-full flex-col">
        <div className="flex shrink-0 justify-center gap-1 overflow-x-auto px-2" aria-label="Other participants">
          {strip.map((p) => (
            <div key={p.peer.id} className="w-[140px] shrink-0 sm:w-[240px]">
              <VideoTile {...p} className="rounded-none" />
            </div>
          ))}
        </div>
        <div className="flex min-h-0 flex-1 px-0 sm:px-[7.5%]">
          <VideoTile {...speaker} solo className={speaker.peer.sharing ? "bg-black" : "bg-stage-2"} />
        </div>
      </div>
    );
  }

  const cols = columnsFor(participants.length);
  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto p-2 sm:p-4">
      <div
        className="grid w-full gap-2 max-sm:max-w-none! max-sm:grid-cols-1!"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          // Keep 16:9 tiles inside the stage height.
          maxWidth: `calc((100dvh - 190px) / ${Math.ceil(participants.length / cols)} * 16 / 9 * ${cols})`,
        }}
      >
        {participants.map((p) => (
          <VideoTile key={p.peer.id} {...p} />
        ))}
      </div>
    </div>
  );
}
