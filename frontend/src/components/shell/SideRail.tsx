"use client";

import { Home, MessageSquareMore, Settings, UserSquare2, Video, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Extra path prefixes that should highlight this item. */
  match?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: Home, match: ["/j/", "/wc/"] },
  { href: "/chat", label: "Chat", icon: MessageSquareMore },
  { href: "/meetings", label: "Meetings", icon: Video },
  { href: "/contacts", label: "Contacts", icon: UserSquare2 },
];
const SETTINGS: NavItem = { href: "/settings", label: "Settings", icon: Settings };

const isActive = (item: NavItem, pathname: string) =>
  pathname === item.href || pathname.startsWith(`${item.href}/`) || !!item.match?.some((p) => pathname.startsWith(p));

function RailLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(item, pathname);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-[54px] w-[70px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] transition-colors",
        active ? "bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "text-[#4a4f57] hover:bg-[#e8e9ed]",
      )}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.1 : 1.8} />
      {item.label}
    </Link>
  );
}

/** Vertical rail on desktop/tablet. */
export function SideRail() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="hidden w-[78px] shrink-0 flex-col items-center gap-1 pt-1 pb-3 md:flex">
      {NAV_ITEMS.map((item) => (
        <RailLink key={item.href} item={item} pathname={pathname} />
      ))}
      <div className="mt-auto">
        <RailLink item={SETTINGS} pathname={pathname} />
      </div>
    </nav>
  );
}

/** Bottom tab bar on phones. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="flex shrink-0 justify-around border-t border-line bg-canvas px-2 pt-1 pb-[max(4px,env(safe-area-inset-bottom))] md:hidden"
    >
      {[...NAV_ITEMS, SETTINGS].map((item) => (
        <RailLink key={item.href} item={item} pathname={pathname} />
      ))}
    </nav>
  );
}
