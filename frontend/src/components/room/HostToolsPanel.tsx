"use client";

import { ChevronDown, ChevronRight, SquareArrowOutUpRight } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toggle } from "@/components/ui/Toggle";
import type { RoomSettings } from "@/types/api";
import { SidePanel } from "./SidePanel";

export type HostToolsView = "main" | "participants" | "share" | "advanced";

interface HostToolsPanelProps {
  settings: RoomSettings;
  /** e.g. "share" when opened from the Share button's "Host tools for share". */
  initialView?: HostToolsView;
  onChange: (changes: Partial<RoomSettings>) => void;
  onSuspend: () => void;
  onMuteAll: () => void;
  onClose: () => void;
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-4 py-2.5 hover:bg-white/5">
      <span className="text-[15px]">{label}</span>
      <Toggle label={label} checked={checked} onChange={onChange} />
    </div>
  );
}

function NavRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-[15px] hover:bg-white/5">
      {label}
      <ChevronRight className="h-4 w-4 text-white/80" />
    </button>
  );
}

function DarkSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block px-4 pb-4">
      <span className="mb-2 block text-[15px] text-white">{label}</span>
      <span className="relative block">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as T)}
          className="h-10 w-full appearance-none rounded-lg border border-white/15 bg-[#1c1c1e] pr-9 pl-3 text-[15px] text-white outline-none focus:border-zoom-blue disabled:border-white/5 disabled:text-white/30"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className={`pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 ${disabled ? "text-white/25" : "text-white/80"}`} />
      </span>
    </label>
  );
}

const WHO_OPTIONS = [
  { value: "all", label: "All Participants" },
  { value: "host", label: "Only Host" },
] as const;

const Divider = () => <div className="mx-2 my-2 h-px bg-white/10" />;
const SectionLabel = ({ children }: { children: string }) => <p className="px-4 pt-2 pb-1 text-[14px] text-white/55">{children}</p>;

/** Zoom's Host tools side panel: meeting security toggles plus "Allow participants to …". */
export function HostToolsPanel({ settings, initialView = "main", onChange, onSuspend, onMuteAll, onClose }: HostToolsPanelProps) {
  const [view, setView] = useState<HostToolsView>(initialView);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const set = (key: keyof RoomSettings) => (value: boolean) => onChange({ [key]: value });

  const titles: Record<HostToolsView, string> = { main: "Host tools", participants: "Participants", share: "Share", advanced: "Advanced" };
  // Multiple simultaneous sharers fixes both "who" questions to All Participants (as in Zoom).
  const multipleSharing = settings.share_mode === "multiple";
  const popOut = (
    <span title="Pop out" className="rounded p-1 text-white/90">
      <SquareArrowOutUpRight className="h-4 w-4" />
    </span>
  );

  return (
    <SidePanel
      tone="dark"
      title={titles[view]}
      onClose={onClose}
      onBack={view === "main" ? undefined : () => setView("main")}
      headerActions={popOut}
    >
      <div className="px-2 py-2">
        {view === "main" && (
          <>
            <ToggleRow label="Enable waiting room" checked={settings.waiting_room} onChange={set("waiting_room")} />
            <ToggleRow label="Lock Meeting" checked={settings.locked} onChange={set("locked")} />
            <ToggleRow label="Hide profile pictures" checked={settings.hide_profile_pictures} onChange={set("hide_profile_pictures")} />
            <Divider />
            <NavRow label="Participants" onClick={() => setView("participants")} />
            <NavRow label="Share" onClick={() => setView("share")} />
            <NavRow label="Advanced" onClick={() => setView("advanced")} />
          </>
        )}

        {view === "participants" && (
          <>
            <button
              onClick={() => setConfirmSuspend(true)}
              className="w-full rounded-lg px-4 py-3 text-left text-[15px] text-[#ff4d4f] hover:bg-white/5"
            >
              Suspend Participant Activities
            </button>
            <Divider />
            <SectionLabel>Allow participants to:</SectionLabel>
            <ToggleRow label="Chat" checked={settings.allow_chat} onChange={set("allow_chat")} />
            <ToggleRow label="Rename Themselves" checked={settings.allow_rename} onChange={set("allow_rename")} />
            <ToggleRow label="Unmute Themselves" checked={settings.allow_unmute} onChange={set("allow_unmute")} />
            <ToggleRow label="Start Video" checked={settings.allow_video} onChange={set("allow_video")} />
            <Divider />
          </>
        )}

        {view === "share" && (
          <div className="pt-2">
            <DarkSelect
              label="How many participants can share at the same time?"
              value={settings.share_mode}
              options={[
                { value: "single", label: "One participant can share at a time" },
                { value: "multiple", label: "Multiple participants can share simultaneously" },
              ]}
              onChange={(share_mode) => onChange({ share_mode })}
            />
            <DarkSelect
              label="Who can share?"
              value={settings.allow_share ? "all" : "host"}
              options={[...WHO_OPTIONS]}
              disabled={multipleSharing}
              onChange={(who) => onChange({ allow_share: who === "all" })}
            />
            <DarkSelect
              label="Who can start sharing when someone else is sharing?"
              value={settings.share_takeover}
              options={[...WHO_OPTIONS]}
              disabled={multipleSharing}
              onChange={(share_takeover) => onChange({ share_takeover })}
            />
          </div>
        )}

        {view === "advanced" && (
          <>
            <button onClick={onMuteAll} className="w-full rounded-lg px-4 py-3 text-left text-[15px] hover:bg-white/5">
              Mute all participants
            </button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmSuspend}
        title="Suspend participant activities?"
        message="Everyone's video, audio and screen sharing will stop, participants will lose chat, rename, unmute, video and share permissions, and the meeting will be locked."
        confirmLabel="Suspend"
        danger
        onCancel={() => setConfirmSuspend(false)}
        onConfirm={() => {
          setConfirmSuspend(false);
          onSuspend();
        }}
      />
    </SidePanel>
  );
}
