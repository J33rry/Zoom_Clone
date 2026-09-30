"use client";

import { Bell, ChevronLeft, ChevronRight, Clock3, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useClickOutside } from "@/hooks/useClickOutside";
import { formatMeetingId } from "@/lib/meetingLink";
import { useCurrentUser } from "./CurrentUser";
import { ZoomLogo } from "./ZoomLogo";

const iconButton =
  "flex h-8 w-8 items-center justify-center rounded-md text-[#4a4f57] transition-colors hover:bg-hover";

export function TopBar() {
  const router = useRouter();
  const user = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-3 bg-white px-4">
      <Link href="/home" className="flex min-w-0 items-center gap-3" aria-label="Zoom Workplace home">
        <ZoomLogo className="h-[22px] w-[88px] shrink-0" />
        <span className="hidden h-6 w-px bg-line-strong sm:block" />
        <span className="hidden text-[21px] font-semibold tracking-[-0.01em] text-ink sm:block">Workplace</span>
      </Link>

      <div className="flex flex-1 items-center justify-end gap-1 md:justify-center">
        <div className="hidden items-center gap-0.5 md:flex">
          <button className={iconButton} aria-label="Back" onClick={() => router.back()}>
            <ChevronLeft className="h-[18px] w-[18px]" />
          </button>
          <button className={iconButton} aria-label="Forward" onClick={() => router.forward()}>
            <ChevronRight className="h-[18px] w-[18px]" />
          </button>
          <button className={iconButton} aria-label="Recent history">
            <Clock3 className="h-4 w-4" />
          </button>
        </div>
        <label className="relative ml-1 hidden w-full max-w-[432px] md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#4a4f57]" />
          <input
            placeholder="Search ⌘ + K"
            aria-label="Search"
            className="h-8 w-full rounded-lg bg-[#eef0f3] px-9 text-center text-sm text-ink outline-none placeholder:text-[#4a4f57] focus:bg-white focus:ring-2 focus:ring-zoom-blue/30"
          />
        </label>
        <button className={`${iconButton} md:hidden`} aria-label="Search">
          <Search className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="flex items-center gap-3 md:min-w-[140px] md:justify-end">
        <button className={iconButton} aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <div ref={menuRef} className="relative">
          <button aria-label="Profile" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
            <Avatar name={user?.name ?? "?"} color={user?.avatar_color} size={32} presence />
          </button>
          {menuOpen && user && (
            <div className="absolute top-11 right-0 z-40 w-72 animate-fade-in rounded-xl bg-white p-4 shadow-popover">
              <div className="flex items-center gap-3">
                <Avatar name={user.name} color={user.avatar_color} size={44} presence />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-[13px] text-muted">{user.email}</p>
                </div>
              </div>
              <div className="mt-3 border-t border-line pt-3 text-[13px] text-muted">
                Personal Meeting ID
                <p className="text-sm font-medium text-ink">{formatMeetingId(user.personal_meeting_id)}</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="mt-3 block rounded-md px-2 py-1.5 text-sm text-ink hover:bg-hover"
              >
                Settings
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
