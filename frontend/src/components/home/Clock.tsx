"use client";

import { useNow } from "@/hooks/useNow";
import { formatClock, formatLongDate } from "@/lib/time";

export function Clock() {
  const now = useNow();
  return (
    <div className="text-center" aria-live="off">
      <p className="h-[54px] text-[44px] leading-[54px] font-semibold tracking-[-0.02em] text-ink sm:text-[46px]">
        {now ? formatClock(now) : ""}
      </p>
      <p className="mt-1 h-6 text-[16px] text-muted">{now ? formatLongDate(now) : ""}</p>
    </div>
  );
}
