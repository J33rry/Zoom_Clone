"use client";

import { useEffect } from "react";
import { useLatest } from "@/hooks/useLatest";

const COPY = {
  ended: "This meeting has been ended by host",
  removed: "You have been removed from this meeting by the host",
} as const;

/** Shown in the full meeting view; `onDone` (button or an 8-second timer) leaves for Home. */
export function MeetingExitScreen({ reason, onDone }: { reason: keyof typeof COPY; onDone: () => void }) {
  const done = useLatest(onDone);
  useEffect(() => {
    const t = setTimeout(() => done.current(), 8000);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-stage px-6 text-center">
      <p className="text-lg font-medium text-white">{COPY[reason]}</p>
      <button onClick={onDone} className="rounded-lg bg-zoom-blue px-5 py-2 text-sm font-semibold text-white hover:bg-zoom-blue-hover">
        Back to Home
      </button>
    </div>
  );
}
