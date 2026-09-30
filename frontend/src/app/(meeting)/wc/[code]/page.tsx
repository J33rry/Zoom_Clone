"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { AppChrome } from "@/components/shell/AppChrome";
import { activeMeeting } from "@/lib/activeMeeting";
import { loadRoomSession, type RoomSession } from "@/lib/session";

const noSubscribe = () => () => {};

/**
 * Meeting room URL. The call itself is rendered by <MeetingDock> (root layout) so it survives
 * navigation; this page makes it the active meeting and provides the backdrop it fills.
 * Entered only with a session from Start (host) or the join screen (participants).
 */
export default function MeetingRoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  // undefined on the server / before hydration; then the stored session or null.
  const raw = useSyncExternalStore(
    noSubscribe,
    () => JSON.stringify(loadRoomSession(code)),
    () => undefined,
  );
  const session = useMemo<RoomSession | null>(() => (raw ? JSON.parse(raw) : null), [raw]);

  useEffect(() => {
    if (raw === "null") router.replace(`/j/${code}`);
    else if (session) activeMeeting.set({ code, session });
  }, [raw, session, code, router]);

  if (!session) return null;
  // The host (the signed-in user) stays inside Workplace; participants get a full-screen meeting.
  return session.role === "host" ? <AppChrome variant="meeting">{null}</AppChrome> : null;
}
