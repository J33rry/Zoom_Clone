/** Date/time helpers. Display uses the browser's local zone; the API speaks UTC ISO strings. */

const MS_PER_DAY = 86_400_000;

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const dayDiff = (date: Date, from: Date) =>
  Math.round((startOfDay(date).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);

/** "6:43 PM" */
export const formatClock = (date: Date) =>
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/** "Tuesday, September 29" */
export const formatLongDate = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

/** "Sep 29" */
export const formatShortDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** "Today, Sep 29" · "Tomorrow, Sep 30" · "Yesterday, Sep 28" · "Wed, Oct 7" */
export function formatRelativeDay(date: Date, now = new Date()): string {
  const diff = dayDiff(date, now);
  const short = formatShortDate(date);
  if (diff === 0) return `Today, ${short}`;
  if (diff === 1) return `Tomorrow, ${short}`;
  if (diff === -1) return `Yesterday, ${short}`;
  return `${date.toLocaleDateString("en-US", { weekday: "short" })}, ${short}`;
}

/** Zoom calendar style: "8:30 - 9:10 PM", or "11:30 AM - 12:10 PM" across meridiems. */
export function formatCompactRange(start: Date, end: Date): string {
  const s = formatClock(start);
  const e = formatClock(end);
  const [sTime, sMeridiem] = s.split(" ");
  const [, eMeridiem] = e.split(" ");
  return sMeridiem === eMeridiem ? `${sTime} - ${e}` : `${s} - ${e}`;
}

/** Meetings tab style: "8:30 PM - 9:10 PM" */
export const formatFullRange = (start: Date, end: Date) => `${formatClock(start)} - ${formatClock(end)}`;

/** "Wednesday September 30, 8:30 - 9:10 PM" (meeting details panel) */
export function formatDetailWhen(start: Date, end: Date): string {
  const day = start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return `${day.replace(",", "")}, ${formatCompactRange(start, end)}`;
}

/* ---------- IANA time-zone conversion (no external date library) ---------- */

export interface WallClock {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
}

/** The wall-clock reading of `date` in `timeZone`. */
export function toWallClock(date: Date, timeZone: string): WallClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

function zoneOffsetMs(date: Date, timeZone: string): number {
  const wall = toWallClock(date, timeZone);
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
  return asUtc - Math.floor(date.getTime() / 60_000) * 60_000;
}

/** The instant at which the clock in `timeZone` reads `wall`. */
export function fromWallClock(wall: WallClock, timeZone: string): Date {
  const guess = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
  const first = guess - zoneOffsetMs(new Date(guess), timeZone);
  // Second pass corrects guesses that straddle a DST transition.
  return new Date(guess - zoneOffsetMs(new Date(first), timeZone));
}
