import { useSyncExternalStore } from "react";
import { loadRoomSession, type RoomSession } from "./session";

/**
 * The meeting this tab is currently in. It lives outside React routes so the call keeps
 * running (as a mini window) while the user moves around Workplace, and it is restored from
 * sessionStorage after a page refresh.
 */
export interface ActiveMeeting {
  code: string;
  session: RoomSession;
}

const STORAGE_KEY = "zoom-clone:active-meeting";
const listeners = new Set<() => void>();
let current: ActiveMeeting | null | undefined; // undefined = not read from storage yet

function read(): ActiveMeeting | null {
  if (current !== undefined) return current;
  current = null;
  try {
    const code = sessionStorage.getItem(STORAGE_KEY);
    const session = code ? loadRoomSession(code) : null;
    if (code && session) current = { code, session };
  } catch {}
  return current;
}

function write(next: ActiveMeeting | null) {
  current = next;
  try {
    if (next) sessionStorage.setItem(STORAGE_KEY, next.code);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
  listeners.forEach((l) => l());
}

export const activeMeeting = {
  get: read,
  set: (next: ActiveMeeting) => {
    const now = read();
    if (now?.code === next.code && now.session.participantId === next.session.participantId) return;
    write(next);
  },
  clear: () => write(null),
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** The active meeting, or null (always null during server rendering). */
export function useActiveMeeting(): ActiveMeeting | null {
  return useSyncExternalStore(activeMeeting.subscribe, read, () => null);
}
