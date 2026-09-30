import type { ReactNode } from "react";

/** Join screen and meeting room: full-screen, without the Workplace navbar and side rail. */
export default function MeetingLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <main className="relative h-dvh overflow-hidden bg-stage">{children}</main>;
}
