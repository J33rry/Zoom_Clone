export type MeetingType = "instant" | "scheduled" | "personal";
export type MeetingStatus = "scheduled" | "live" | "ended";
export type ParticipantRole = "host" | "participant";

export interface UserBrief {
  id: number;
  name: string;
  avatar_color: string;
  initial: string;
}

export interface User extends UserBrief {
  email: string;
  personal_meeting_id: string;
  timezone: string;
}

export interface Meeting {
  id: number;
  join_code: string;
  topic: string;
  description: string | null;
  meeting_type: MeetingType;
  use_pmi: boolean;
  /** ISO-8601 UTC timestamps */
  start_time: string;
  end_time: string;
  duration_minutes: number;
  timezone: string;
  passcode: string | null;
  passcode_enabled: boolean;
  waiting_room_enabled: boolean;
  host_video_on: boolean;
  participant_video_on: boolean;
  status: MeetingStatus;
  started_at: string | null;
  ended_at: string | null;
  host: UserBrief;
  invite_link: string;
  invitation: string;
}

/** Someone who joined a meeting (one entry per person, host first). */
export interface MeetingAttendee {
  name: string;
  avatar_color: string;
  role: ParticipantRole;
  /** Joined without an account ("External"). */
  is_guest: boolean;
  in_meeting: boolean;
}

export interface MeetingSettingsInput {
  topic: string;
  description: string | null;
  start_time: string;
  duration_minutes: number;
  timezone: string;
  use_pmi: boolean;
  passcode_enabled: boolean;
  passcode: string | null;
  waiting_room_enabled: boolean;
  host_video_on: boolean;
  participant_video_on: boolean;
}

export interface MeetingLookup {
  id: number;
  join_code: string;
  topic: string;
  host_name: string;
  status: MeetingStatus;
  requires_passcode: boolean;
  /** Scheduled default: whether participants join with video on. */
  participant_video_on: boolean;
}

export interface JoinRequest {
  display_name: string;
  passcode?: string | null;
  as_host?: boolean;
  audio_muted?: boolean;
  video_on?: boolean;
}

export interface JoinResponse {
  participant_id: string;
  role: ParticipantRole;
  meeting: Meeting;
}

export interface TimezoneOption {
  id: string;
  label: string;
}

/* ---------- realtime ---------- */

export interface PeerInfo {
  id: string;
  name: string;
  role: ParticipantRole;
  avatar_color: string;
  audio_muted: boolean;
  video_on: boolean;
  sharing: boolean;
  /** Joined without an account: no profile picture, so tiles show the name. */
  is_guest: boolean;
}

export interface ChatMessage {
  id: number;
  participant_id: string;
  name: string;
  body: string;
  created_at: string;
  /** null = Meeting Group Chat; otherwise a direct message to this participant. */
  to: { id: string; name: string } | null;
}

/** Host tools state for the live session (mirrors backend RoomSettings). */
export interface RoomSettings {
  waiting_room: boolean;
  locked: boolean;
  hide_profile_pictures: boolean;
  allow_chat: boolean;
  allow_rename: boolean;
  allow_unmute: boolean;
  allow_video: boolean;
  /** "Who can share?" — All Participants (true) / Only Host (false). */
  allow_share: boolean;
  /** "How many participants can share at the same time?" */
  share_mode: "single" | "multiple";
  /** "Who can start sharing when someone else is sharing?" */
  share_takeover: "all" | "host";
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  waiting_room: false,
  locked: false,
  hide_profile_pictures: false,
  allow_chat: true,
  allow_rename: true,
  allow_unmute: true,
  allow_video: true,
  allow_share: true,
  share_mode: "multiple",
  share_takeover: "all",
};

export type SignalData =
  | { kind: "offer" | "answer"; sdp: string }
  | { kind: "ice"; candidate: RTCIceCandidateInit };

export type ServerMessage =
  | { type: "waiting" }
  | {
      type: "room-state";
      self: PeerInfo;
      peers: PeerInfo[];
      chat: ChatMessage[];
      settings: RoomSettings;
      /** Hosts only: who is in the waiting room. */
      waiting?: PeerInfo[];
    }
  | { type: "room-settings"; settings: RoomSettings }
  | { type: "waiting-list"; peers: PeerInfo[] }
  | { type: "force-video-off"; reason: string }
  | { type: "force-share-off"; reason: string }
  | { type: "peer-joined"; peer: PeerInfo }
  | { type: "peer-updated"; peer: PeerInfo }
  | { type: "peer-left"; peer_id: string }
  | { type: "signal"; from: string; data: SignalData }
  | { type: "chat"; message: ChatMessage }
  | { type: "reaction"; from: string; name: string; emoji: string }
  | { type: "force-mute"; reason?: string }
  | { type: "removed" }
  | { type: "meeting-ended" }
  | { type: "error"; message: string };

export type ClientMessage =
  | { type: "signal"; to: string; data: SignalData }
  | { type: "media-state"; audio_muted: boolean; video_on: boolean; sharing: boolean }
  | { type: "chat"; body: string; to?: string }
  | { type: "reaction"; emoji: string }
  | { type: "mute"; target: string }
  | { type: "mute-all" }
  | { type: "rename"; name: string; target?: string }
  | { type: "admit"; target: string }
  | { type: "deny"; target: string }
  | { type: "admit-all" }
  | { type: "update-settings"; settings: Partial<RoomSettings> }
  | { type: "suspend" }
  | { type: "remove"; target: string }
  | { type: "end-meeting" };
