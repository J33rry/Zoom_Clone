"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BottomNav, SideRail } from "./SideRail";
import { TopBar } from "./TopBar";

/**
 * The Zoom Workplace frame: top bar, side rail (bottom tabs on phones) and the content card.
 * `meeting` turns the card into the dark meeting stage (a host's meeting runs inside Workplace).
 */
export function AppChrome({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "meeting" }) {
  const meeting = variant === "meeting";
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <SideRail />
        <main
          className={cn(
            "relative min-w-0 flex-1 overflow-hidden border md:mr-1.5 md:mb-1.5 md:rounded-xl",
            meeting ? "border-stage bg-stage" : "border-line bg-white",
          )}
        >
          {children}
        </main>
      </div>
      {!meeting && <BottomNav />}
    </div>
  );
}
