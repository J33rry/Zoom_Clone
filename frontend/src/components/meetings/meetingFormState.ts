import { fromWallClock, toWallClock } from "@/lib/time";
import type { Meeting, MeetingSettingsInput } from "@/types/api";

/** Form fields as the user sees them (wall-clock in the chosen zone, 12-hour time). */
export interface MeetingFormValues {
  topic: string;
  description: string;
  date: { year: number; month: number; day: number };
  time: string; // "8:30"
  meridiem: "AM" | "PM";
  durationHours: number;
  durationMinutes: number;
  timezone: string;
  usePmi: boolean;
  passcodeEnabled: boolean;
  passcode: string;
  waitingRoom: boolean;
  hostVideo: boolean;
  participantVideo: boolean;
}

/** "12:00", "12:30", "1:00" … "11:30" — the options in Zoom's time dropdown. */
export const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = Math.floor(i / 2) === 0 ? 12 : Math.floor(i / 2);
  return `${hour}:${i % 2 === 0 ? "00" : "30"}`;
});
export const HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => i);
export const MINUTE_OPTIONS = [0, 15, 30, 40, 45];

const PASSCODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
export const randomPasscode = () =>
  Array.from({ length: 6 }, () => PASSCODE_CHARS[Math.floor(Math.random() * PASSCODE_CHARS.length)]).join("");

function to12h(hour24: number, minute: number): Pick<MeetingFormValues, "time" | "meridiem"> {
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { time: `${hour12}:${String(minute).padStart(2, "0")}`, meridiem: hour24 < 12 ? "AM" : "PM" };
}

function to24h(time: string, meridiem: "AM" | "PM"): { hour: number; minute: number } {
  const [h, m] = time.split(":").map(Number);
  return { hour: (h % 12) + (meridiem === "PM" ? 12 : 0), minute: m };
}

/** Defaults for a new meeting: the next half hour, 40 minutes, the user's zone. */
export function defaultFormValues(timezone: string): MeetingFormValues {
  const next = new Date(Math.ceil((Date.now() + 60_000) / 1_800_000) * 1_800_000);
  const wall = toWallClock(next, timezone);
  return {
    topic: "My Meeting",
    description: "",
    date: { year: wall.year, month: wall.month, day: wall.day },
    ...to12h(wall.hour, wall.minute),
    durationHours: 0,
    durationMinutes: 40,
    timezone,
    usePmi: false,
    passcodeEnabled: true,
    passcode: randomPasscode(),
    waitingRoom: false,
    hostVideo: true,
    participantVideo: true,
  };
}

export function valuesFromMeeting(meeting: Meeting): MeetingFormValues {
  const wall = toWallClock(new Date(meeting.start_time), meeting.timezone);
  // Snap to the dropdown's 30-minute grid.
  const minute = wall.minute < 30 ? 0 : 30;
  return {
    topic: meeting.topic,
    description: meeting.description ?? "",
    date: { year: wall.year, month: wall.month, day: wall.day },
    ...to12h(wall.hour, minute),
    durationHours: Math.floor(meeting.duration_minutes / 60),
    durationMinutes: meeting.duration_minutes % 60,
    timezone: meeting.timezone,
    usePmi: meeting.use_pmi,
    passcodeEnabled: meeting.passcode_enabled,
    passcode: meeting.passcode ?? randomPasscode(),
    waitingRoom: meeting.waiting_room_enabled,
    hostVideo: meeting.host_video_on,
    participantVideo: meeting.participant_video_on,
  };
}

export function validate(values: MeetingFormValues): string | null {
  if (!values.topic.trim()) return "Please enter a meeting topic.";
  const minutes = values.durationHours * 60 + values.durationMinutes;
  if (minutes < 15) return "Duration must be at least 15 minutes.";
  if (minutes > 24 * 60) return "Duration cannot be longer than 24 hours.";
  if (values.passcodeEnabled && !values.usePmi && !/^[A-Za-z0-9]{1,10}$/.test(values.passcode)) {
    return "Passcode must be 1–10 letters or numbers.";
  }
  return null;
}

export function toPayload(values: MeetingFormValues): MeetingSettingsInput {
  const { hour, minute } = to24h(values.time, values.meridiem);
  const start = fromWallClock({ ...values.date, hour, minute }, values.timezone);
  return {
    topic: values.topic.trim(),
    description: values.description.trim() || null,
    start_time: start.toISOString(),
    duration_minutes: values.durationHours * 60 + values.durationMinutes,
    timezone: values.timezone,
    use_pmi: values.usePmi,
    passcode_enabled: values.passcodeEnabled,
    passcode: values.passcodeEnabled ? values.passcode : null,
    waiting_room_enabled: values.waitingRoom,
    host_video_on: values.hostVideo,
    participant_video_on: values.participantVideo,
  };
}
