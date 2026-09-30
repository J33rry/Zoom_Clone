"use client";

import { Check, ChevronDown, MessagesSquare, PenLine, SendHorizontal, Smile, SquareArrowOutUpRight } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/time";
import type { ChatMessage, PeerInfo } from "@/types/api";
import { SidePanel } from "./SidePanel";

const GROUP_CHAT = "Meeting Group Chat";
const EMOJIS = ["😀", "😂", "😍", "👍", "👏", "🙏", "🎉", "❤️", "🔥", "😮", "😢", "🤔"];

interface ChatPanelProps {
  title: string;
  messages: ChatMessage[];
  self: PeerInfo;
  /** Everyone else in the meeting (possible direct-message recipients). */
  peers: PeerInfo[];
  /** The host turned off "Allow participants to: Chat". */
  disabled?: boolean;
  onSend: (body: string, to?: string) => void;
  onClose: () => void;
}

function RecipientMenu({ peers, value, onChange }: { peers: PeerInfo[]; value: string | null; onChange: (id: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  const selected = peers.find((p) => p.id === value);
  const option = "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-[14px] hover:bg-white/10";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex max-w-[200px] items-center gap-1 rounded-full bg-[#0e72ed] px-3 py-0.5 text-[13px] text-white ring-2 ring-[#0e72ed]/40 hover:bg-[#0b5cff]"
      >
        <span className="truncate">{selected ? selected.name : GROUP_CHAT}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      </button>
      {open && (
        <div role="listbox" className="absolute bottom-8 left-0 z-20 max-h-64 w-60 overflow-y-auto rounded-lg border border-white/10 bg-[#2b2b2d] p-1 shadow-panel">
          {[{ id: null, name: GROUP_CHAT, role: null as string | null }, ...peers].map((p) => (
            <button
              key={p.id ?? "group"}
              role="option"
              aria-selected={value === p.id}
              onClick={() => {
                onChange(p.id);
                setOpen(false);
              }}
              className={option}
            >
              <Check className={cn("h-3.5 w-3.5 shrink-0", value !== p.id && "invisible")} />
              <span className="truncate">{p.name}</span>
              {p.role === "host" && <span className="shrink-0 text-white/45">(Host)</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Zoom's in-meeting chat: group chat plus direct messages, in the dark panel style. */
export function ChatPanel({ title, messages, self, peers, disabled, onSend, onClose }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [showWho, setShowWho] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  useClickOutside(emojiRef, () => setEmojiOpen(false), emojiOpen);

  // If the person we were messaging leaves, fall back to the group chat.
  const recipient = peers.find((p) => p.id === recipientId) ?? null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    if (!body) return;
    onSend(body, recipient?.id);
    setDraft("");
  };

  const nameOf = (id: string, name: string) => (id === self.id ? "Me" : name);
  const iconBtn = "rounded p-1 text-white/70 hover:bg-white/10 hover:text-white";

  return (
    <SidePanel
      tone="dark"
      title={title}
      onClose={onClose}
      className="sm:w-[380px]"
      leading={<MessagesSquare className="h-[18px] w-[18px]" />}
      headerActions={
        <span title="Pop out" className="rounded p-1 text-white/90">
          <SquareArrowOutUpRight className="h-4 w-4" />
        </span>
      }
      footer={
        disabled ? (
          <p className="rounded-lg bg-white/5 px-3 py-3 text-center text-[13px] text-white/60">The host has disabled chat for participants.</p>
        ) : (
          <form onSubmit={submit} className="-m-3">
            <button
              type="button"
              onClick={() => setShowWho((s) => !s)}
              className="w-full bg-white/5 px-3 py-1.5 text-left text-[12px] text-white/60 hover:text-white/80"
            >
              Who can see your messages?
            </button>
            {showWho && (
              <p className="px-3 pt-2 text-[12px] leading-5 text-white/60">
                {recipient
                  ? `Only you and ${recipient.name} can see this direct message.`
                  : "Messages to Meeting Group Chat can be seen by everyone in the meeting."}
              </p>
            )}
            <div className="flex items-center gap-1.5 px-3 pt-2.5 text-[13px]">
              <span className="text-white/60">to:</span>
              <RecipientMenu peers={peers} value={recipient?.id ?? null} onChange={setRecipientId} />
              {recipient && <span className="text-[#ff5a5a]">(Direct Message)</span>}
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={3}
              maxLength={2000}
              placeholder="Type message here ..."
              aria-label="Chat message"
              className="block w-full resize-none bg-transparent px-3 pt-2 text-[15px] text-white outline-none placeholder:text-white/70"
            />
            <div className="flex items-center gap-1 px-2 pt-1 pb-2">
              <span title="Formatting" className={iconBtn}>
                <PenLine className="h-4 w-4" />
              </span>
              <div ref={emojiRef} className="relative">
                <button type="button" aria-label="Emoji" onClick={() => setEmojiOpen((o) => !o)} className={iconBtn}>
                  <Smile className="h-4 w-4" />
                </button>
                {emojiOpen && (
                  <div className="absolute bottom-8 left-0 z-20 grid w-52 grid-cols-6 gap-0.5 rounded-lg border border-white/10 bg-[#2b2b2d] p-1.5 shadow-panel">
                    {EMOJIS.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => {
                          setDraft((d) => d + emoji);
                          setEmojiOpen(false);
                        }}
                        className="rounded p-1 text-lg hover:bg-white/10"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                aria-label="Send"
                disabled={!draft.trim()}
                className="ml-auto rounded-md p-1.5 text-white enabled:bg-[#0e72ed] enabled:hover:bg-[#0b5cff] disabled:bg-white/10 disabled:text-white/40"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          </form>
        )
      }
    >
      <div className="flex min-h-full flex-col px-4 py-3">
        <p className="px-4 text-center text-[13px] leading-5 text-white/60">
          Messages addressed to &quot;{GROUP_CHAT}&quot; are visible to everyone in the meeting.
        </p>
        <div className="mt-4 space-y-4">
          {messages.map((m) => (
            <div key={m.id}>
              <p className="text-[12px] text-white/55">
                <span className="font-semibold text-white">{nameOf(m.participant_id, m.name)}</span>
                {m.to ? (
                  <>
                    {" "}
                    to <span className="font-semibold text-white">{nameOf(m.to.id, m.to.name)}</span>{" "}
                    <span className="text-[#ff5a5a]">(Direct Message)</span>
                  </>
                ) : (
                  <> to Everyone</>
                )}
                <span className="ml-2">{formatClock(new Date(m.created_at))}</span>
              </p>
              <p className="mt-0.5 text-[14px] break-words whitespace-pre-wrap text-white/90">{m.body}</p>
            </div>
          ))}
        </div>
        <div ref={endRef} />
      </div>
    </SidePanel>
  );
}
