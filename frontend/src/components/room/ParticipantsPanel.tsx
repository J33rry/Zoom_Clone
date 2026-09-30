"use client";

import { Mic, MicOff, MoreHorizontal, Video, VideoOff } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { PeerInfo } from "@/types/api";
import { SidePanel } from "./SidePanel";

interface ParticipantsPanelProps {
  self: PeerInfo;
  peers: PeerInfo[];
  waiting: PeerInfo[];
  isHost: boolean;
  canRenameSelf: boolean;
  hideProfilePictures: boolean;
  onClose: () => void;
  onMute: (peerId: string) => void;
  onMuteAll: () => void;
  onRemove: (peer: PeerInfo) => void;
  onRename: (peer: PeerInfo) => void;
  onAdmit: (peerId: string) => void;
  onAdmitAll: () => void;
  onDeny: (peerId: string) => void;
  onInvite: () => void;
}

function roleSuffix(peer: PeerInfo, isSelf: boolean): string {
  const parts = [peer.role === "host" && "Host", isSelf && "me"].filter(Boolean);
  return parts.length ? ` (${parts.join(", ")})` : "";
}

/** Colored initial, or a neutral one when the host hides profile pictures. */
function PeerAvatar({ peer, hidden }: { peer: PeerInfo; hidden: boolean }) {
  return <Avatar name={peer.name} color={hidden ? "#8f97a3" : peer.avatar_color} size={32} />;
}

function RowMenu({ items }: { items: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  if (items.length === 0) return null;
  return (
    <div ref={ref} className="relative">
      <button aria-label="More options" onClick={() => setOpen((o) => !o)} className="rounded p-1 hover:bg-line">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute top-7 right-0 z-10 w-36 rounded-lg bg-white p-1 shadow-popover">
          {items.map((item) => (
            <button
              key={item.label}
              className={`w-full rounded px-3 py-1.5 text-left text-sm hover:bg-hover ${item.danger ? "text-danger" : "text-ink"}`}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ParticipantsPanel(props: ParticipantsPanelProps) {
  const { self, peers, waiting, isHost, canRenameSelf, hideProfilePictures } = props;
  // Host first, then me, then everyone else alphabetically — Zoom's ordering.
  const everyone = [self, ...peers].sort((a, b) => {
    if (a.role !== b.role) return a.role === "host" ? -1 : 1;
    if (a.id === self.id || b.id === self.id) return a.id === self.id ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <SidePanel
      title={`Participants (${everyone.length})`}
      onClose={props.onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={props.onInvite} className="flex-1">
            Invite
          </Button>
          {isHost && (
            <Button variant="outline" size="sm" onClick={props.onMuteAll} disabled={peers.length === 0} className="flex-1">
              Mute All
            </Button>
          )}
        </div>
      }
    >
      {isHost && waiting.length > 0 && (
        <section aria-label="Waiting room" className="border-b border-line pb-2">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <p className="text-[13px] font-semibold text-ink">Waiting Room ({waiting.length})</p>
            <button onClick={props.onAdmitAll} className="text-[13px] font-semibold text-zoom-blue hover:underline">
              Admit all
            </button>
          </div>
          <ul>
            {waiting.map((peer) => (
              <li key={peer.id} className="flex items-center gap-3 px-4 py-2">
                <PeerAvatar peer={peer} hidden={hideProfilePictures} />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{peer.name}</span>
                <Button size="sm" onClick={() => props.onAdmit(peer.id)} className="h-7 px-2.5">
                  Admit
                </Button>
                <Button size="sm" variant="outline" onClick={() => props.onDeny(peer.id)} className="h-7 px-2.5">
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="py-2">
        {everyone.map((peer) => {
          const isSelf = peer.id === self.id;
          const manage = isHost && !isSelf;
          const menu = [
            ...((isSelf && canRenameSelf) || manage ? [{ label: "Rename", onClick: () => props.onRename(peer) }] : []),
            ...(manage ? [{ label: "Remove", onClick: () => props.onRemove(peer), danger: true }] : []),
          ];
          return (
            <li key={peer.id} className="group flex items-center gap-3 px-4 py-2 hover:bg-hover">
              <PeerAvatar peer={peer} hidden={hideProfilePictures} />
              <span className="min-w-0 flex-1 truncate text-sm text-ink">
                {peer.name}
                <span className="text-muted">{roleSuffix(peer, isSelf)}</span>
              </span>
              <div className="hidden items-center gap-1 group-focus-within:flex group-hover:flex">
                {manage && !peer.audio_muted && (
                  <Button size="sm" variant="outline" onClick={() => props.onMute(peer.id)} className="h-7 px-2.5">
                    Mute
                  </Button>
                )}
                <RowMenu items={menu} />
              </div>
              <span className="flex items-center gap-2 text-[#4a4f57]">
                {peer.audio_muted ? <MicOff className="h-4 w-4 text-danger" aria-label="Muted" /> : <Mic className="h-4 w-4" aria-label="Unmuted" />}
                {peer.video_on ? <Video className="h-4 w-4" aria-label="Video on" /> : <VideoOff className="h-4 w-4 text-danger" aria-label="Video off" />}
              </span>
            </li>
          );
        })}
      </ul>
    </SidePanel>
  );
}
