import type {
  JoinRequest,
  JoinResponse,
  Meeting,
  MeetingAttendee,
  MeetingLookup,
  MeetingSettingsInput,
  TimezoneOption,
  User,
} from "@/types/api";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
export const WS_URL = (process.env.NEXT_PUBLIC_WS_URL ?? API_URL.replace(/^http/, "ws")).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** FastAPI returns either {detail: "msg"} or {detail: [{msg, loc}, ...]} for validation errors. */
function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) {
      return String(detail[0].msg).replace(/^Value error, /, "");
    }
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "Unable to reach the server. Please check your connection.");
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, extractMessage(body, "Something went wrong. Please try again."));
  }
  return body as T;
}

const json = (data: unknown) => JSON.stringify(data);

export const api = {
  me: () => request<User>("/me"),
  timezones: () => request<TimezoneOption[]>("/timezones"),

  meetingsBetween: (from: Date, to: Date) =>
    request<Meeting[]>(
      `/meetings?${new URLSearchParams({ from: from.toISOString(), to: to.toISOString() })}`,
    ),
  upcoming: () => request<Meeting[]>("/meetings/upcoming"),
  recent: () => request<Meeting[]>("/meetings/recent"),
  getMeeting: (id: number) => request<Meeting>(`/meetings/${id}`),
  participants: (id: number) => request<MeetingAttendee[]>(`/meetings/${id}/participants`),

  createInstant: (body: { use_pmi?: boolean; video_on?: boolean }) =>
    request<Meeting>("/meetings/instant", { method: "POST", body: json(body) }),
  schedule: (body: MeetingSettingsInput) => request<Meeting>("/meetings", { method: "POST", body: json(body) }),
  update: (id: number, body: MeetingSettingsInput) =>
    request<Meeting>(`/meetings/${id}`, { method: "PUT", body: json(body) }),
  remove: (id: number) => request<void>(`/meetings/${id}`, { method: "DELETE" }),
  end: (id: number) => request<Meeting>(`/meetings/${id}/end`, { method: "POST" }),

  lookup: (code: string) => request<MeetingLookup>(`/meetings/code/${encodeURIComponent(code)}`),
  join: (code: string, body: JoinRequest) =>
    request<JoinResponse>(`/meetings/code/${encodeURIComponent(code)}/join`, {
      method: "POST",
      body: json(body),
    }),
};

export const meetingSocketUrl = (meetingId: number, participantId: string) =>
  `${WS_URL}/ws/meetings/${meetingId}?pid=${encodeURIComponent(participantId)}`;
