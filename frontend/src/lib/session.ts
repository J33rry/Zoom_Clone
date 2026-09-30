import type { ParticipantRole } from "@/types/api";

/** The participant session created by /join, handed from the join/start flow to the room page. */
export interface RoomSession {
  meetingId: number;
  participantId: string;
  role: ParticipantRole;
  displayName: string;
  audioMuted: boolean;
  videoOn: boolean;
}

const key = (code: string) => `zoom-clone:session:${code}`;
const RECENT_IDS_KEY = "zoom-clone:recent-meeting-ids";

// Storage can throw (private mode, blocked site data); every access is guarded.
export function saveRoomSession(code: string, session: RoomSession): void {
  try {
    sessionStorage.setItem(key(code), JSON.stringify(session));
  } catch {}
}

export function loadRoomSession(code: string): RoomSession | null {
  try {
    const raw = sessionStorage.getItem(key(code));
    return raw ? (JSON.parse(raw) as RoomSession) : null;
  } catch {
    return null;
  }
}

export function clearRoomSession(code: string): void {
  try {
    sessionStorage.removeItem(key(code));
  } catch {}
}

export function loadRecentMeetingIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_IDS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function rememberMeetingId(code: string): void {
  try {
    const ids = [code, ...loadRecentMeetingIds().filter((id) => id !== code)].slice(0, 5);
    localStorage.setItem(RECENT_IDS_KEY, JSON.stringify(ids));
  } catch {}
}
