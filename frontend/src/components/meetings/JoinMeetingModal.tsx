"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useClickOutside } from "@/hooks/useClickOutside";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatMeetingId, parseJoinInput } from "@/lib/meetingLink";
import { loadRecentMeetingIds, rememberMeetingId } from "@/lib/session";

interface JoinMeetingModalProps {
  open: boolean;
  onClose: () => void;
}

export function JoinMeetingModal({ open, onClose }: JoinMeetingModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Join Meeting">
      {/* Mounted per open, so the form always starts empty. */}
      {open && <JoinMeetingForm onClose={onClose} />}
    </Modal>
  );
}

function JoinMeetingForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [recentIds] = useState(loadRecentMeetingIds);
  const [listOpen, setListOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);
  useClickOutside(comboRef, () => setListOpen(false), listOpen);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseJoinInput(value);
    if (!parsed) {
      setError("Please enter a valid meeting ID or invite link.");
      return;
    }
    setChecking(true);
    setError(null);
    try {
      // Validate the meeting exists before asking for a display name.
      await api.lookup(parsed.code);
      rememberMeetingId(parsed.code);
      const query = parsed.passcode ? `?pwd=${encodeURIComponent(parsed.passcode)}` : "";
      router.push(`/j/${parsed.code}${query}`);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <form onSubmit={submit}>
        <label htmlFor="join-meeting-id" className="mb-2 block text-sm text-ink">
          Meeting ID or Personal Link Name
        </label>
        <div ref={comboRef} className="relative">
          <input
            id="join-meeting-id"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            autoComplete="off"
            aria-invalid={!!error}
            className={cn(
              "h-10 w-full rounded-lg border bg-white pr-10 pl-3.5 text-[15px] text-ink outline-none",
              "focus:ring-2 focus:ring-zoom-blue/15",
              error ? "border-danger" : "border-line-strong focus:border-zoom-blue",
            )}
          />
          <button
            type="button"
            aria-label="Recent meeting IDs"
            onClick={() => setListOpen((o) => !o)}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-ink hover:bg-hover"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          {listOpen && (
            <ul className="absolute top-11 z-10 w-full rounded-lg bg-white py-1 shadow-popover">
              {recentIds.length === 0 && <li className="px-3.5 py-2 text-sm text-muted">No recent meetings</li>}
              {recentIds.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    className="w-full px-3.5 py-2 text-left text-sm text-ink hover:bg-hover"
                    onClick={() => {
                      setValue(formatMeetingId(id));
                      setListOpen(false);
                    }}
                  >
                    {formatMeetingId(id)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
        <div className="mt-8 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!value.trim() || checking}>
            Join
          </Button>
        </div>
    </form>
  );
}
