"use client";

import { AlertTriangle, ChevronLeft, ChevronUp, Mic, MicOff, SquareUser, Video, VideoOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { useCurrentUser } from "@/components/shell/CurrentUser";
import { Spinner } from "@/components/ui/Spinner";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { rememberMeetingId, saveRoomSession } from "@/lib/session";

const NAME_KEY = "zoom-clone:display-name";

function loadSavedName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(NAME_KEY);
  } catch {
    return null;
  }
}

function saveName(name: string | null) {
  try {
    if (name) localStorage.setItem(NAME_KEY, name);
    else localStorage.removeItem(NAME_KEY);
  } catch {}
}

/**
 * Asks for the mic once (so the browser's permission prompt appears on the join screen, as in
 * Zoom) and previews the camera while video is on. Streams are released immediately / on unmount;
 * the meeting room acquires its own.
 */
function usePreviewMedia(videoOn: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [micBlocked, setMicBlocked] = useState(false);
  const [camBlocked, setCamBlocked] = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
        setMicBlocked(false);
      })
      .catch(() => setMicBlocked(true));
  }, []);

  useEffect(() => {
    if (!videoOn) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setCamBlocked(false);
      })
      .catch(() => setCamBlocked(true));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [videoOn]);

  return { videoRef, micBlocked, camBlocked };
}

function PreviewButton({ icon, label, blocked, onClick, caret }: { icon: ReactNode; label: string; blocked: boolean; onClick: () => void; caret?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="flex min-w-[76px] flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[13px] text-white hover:bg-white/10">
      <span className="relative flex h-6 items-center">
        {icon}
        {blocked && <AlertTriangle className="absolute -right-2 -bottom-0.5 h-3.5 w-3.5 fill-danger text-black" />}
        {caret && <ChevronUp className="absolute -top-0.5 -right-6 h-3.5 w-3.5 text-white/80" />}
      </span>
      {label}
    </button>
  );
}

/** Placeholder shown in the preview when the camera is off. */
function SilhouettePlaceholder() {
  return (
    <span className="flex h-[150px] w-[172px] items-end justify-center overflow-hidden rounded-[28px] bg-[#58585c] sm:h-[175px] sm:w-[205px]" aria-hidden>
      <svg viewBox="0 0 200 170" className="h-full w-full">
        <circle cx="100" cy="68" r="32" fill="#2c2c2e" />
        <path d="M40 160c0-33 27-56 60-56s60 23 60 56z" fill="#2c2c2e" />
      </svg>
    </span>
  );
}

function ScreenMessage({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-white">
      <h1 className="text-xl font-semibold">{title}</h1>
      {text && <p className="max-w-sm text-sm text-white/60">{text}</p>}
      <Link href="/home" className="text-sm font-semibold text-[#4d8dff] hover:underline">
        Back to Home
      </Link>
    </div>
  );
}

/** Zoom's "Enter Meeting Info" join screen (full-screen, dark). */
export function PreJoin({ code, initialPasscode }: { code: string; initialPasscode: string }) {
  const router = useRouter();
  const user = useCurrentUser();
  const { data: meeting, error: lookupError, loading } = useAsync(() => api.lookup(code), [code]);
  // null = untouched: the last remembered name, else the signed-in user's name.
  const [typedName, setName] = useState<string | null>(loadSavedName);
  const [remember, setRemember] = useState(true);
  const [passcode, setPasscode] = useState(initialPasscode);
  const [audioOn, setAudioOn] = useState(true);
  // null = untouched: follow the meeting's scheduled "Participant video" setting.
  const [videoChoice, setVideoOn] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const name = typedName ?? user?.name ?? "";
  const videoOn = videoChoice ?? meeting?.participant_video_on ?? false;
  const { videoRef, micBlocked, camBlocked } = usePreviewMedia(videoOn);
  // The invite link carries the passcode; only ask for it when joining by Meeting ID.
  const askPasscode = !!meeting?.requires_passcode && !initialPasscode;

  const join = async (event: FormEvent) => {
    event.preventDefault();
    const displayName = name.trim();
    if (!displayName) return setError("Please enter your name.");
    setJoining(true);
    setError(null);
    try {
      const joined = await api.join(code, {
        display_name: displayName,
        passcode: passcode.trim() || null,
        audio_muted: !audioOn || micBlocked,
        video_on: videoOn && !camBlocked,
      });
      saveName(remember ? displayName : null);
      rememberMeetingId(code);
      saveRoomSession(code, {
        meetingId: joined.meeting.id,
        participantId: joined.participant_id,
        role: joined.role,
        displayName,
        audioMuted: !audioOn || micBlocked,
        videoOn: videoOn && !camBlocked,
      });
      router.replace(`/wc/${code}`);
    } catch (err) {
      setError((err as Error).message);
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-white">
        <Spinner />
      </div>
    );
  }
  if (lookupError || !meeting) {
    return <ScreenMessage title="Unable to join this meeting" text={lookupError?.message ?? "This meeting could not be found."} />;
  }

  const showVideo = videoOn && !camBlocked;
  const input =
    "h-12 w-full rounded-lg border border-[#8e8e93] bg-transparent px-5 text-[16px] text-white outline-none focus:border-[#4d8dff] focus:ring-2 focus:ring-[#4d8dff]/30";

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#1f2023] text-white">
      <div className="px-6 pt-6 sm:px-12">
        <Link href="/home" className="inline-flex items-center gap-1 text-[16px] text-[#4d8dff] hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-[1340px] flex-1 flex-col items-center justify-center gap-10 px-5 py-8 lg:flex-row lg:gap-11">
        {/* Preview */}
        <div className="relative flex aspect-video w-full max-w-[820px] items-center justify-center overflow-hidden rounded-2xl bg-[#3a3a3c]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn("absolute inset-0 h-full w-full -scale-x-100 object-cover", !showVideo && "hidden")}
          />
          {!showVideo && <SilhouettePlaceholder />}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center rounded-lg bg-black/90 px-1 py-0.5">
            <PreviewButton
              icon={audioOn && !micBlocked ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              label={audioOn ? "Mute" : "Unmute"}
              blocked={micBlocked}
              onClick={() => setAudioOn(!audioOn)}
            />
            <PreviewButton
              icon={showVideo ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              label={videoOn ? "Stop Video" : "Start Video"}
              blocked={camBlocked}
              onClick={() => setVideoOn(!videoOn)}
              caret
            />
          </div>
          <button
            type="button"
            title="Virtual backgrounds are not available in this clone"
            className="absolute right-3 bottom-3 hidden items-center gap-1.5 rounded-lg bg-black/90 px-3 py-2 text-[14px] text-white sm:flex"
          >
            <SquareUser className="h-4 w-4" /> Backgrounds
          </button>
        </div>

        {/* Form */}
        <form onSubmit={join} className="w-full max-w-[470px]">
          <h1 className="mb-4 text-center text-[28px] font-bold tracking-[-0.01em]">Enter Meeting Info</h1>
          <label htmlFor="display-name" className="mb-2 block text-[16px] font-semibold">
            Your Name
          </label>
          <input
            id="display-name"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
            className={input}
            autoFocus
          />
          {askPasscode && (
            <>
              <label htmlFor="passcode" className="mt-4 mb-2 block text-[16px] font-semibold">
                Meeting Passcode
              </label>
              <input id="passcode" value={passcode} maxLength={10} onChange={(e) => setPasscode(e.target.value)} className={input} />
            </>
          )}
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-[15px]">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[#4d8dff]" />
            Remember my name for future meetings
          </label>
          {error && (
            <p role="alert" className="mt-3 text-[14px] text-[#ff6b6b]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={joining || !name.trim()}
            className="mt-4 h-12 w-full rounded-lg bg-[#0e72ed] text-[17px] font-semibold text-white transition-colors hover:bg-[#0b5cff] disabled:opacity-50"
          >
            {joining ? "Joining…" : "Join"}
          </button>
          <p className="mt-6 text-[15px] leading-6 text-white/60">
            By clicking &quot;Join&quot;, you agree to our <span className="text-[#4d8dff]">Terms of Service</span> and{" "}
            <span className="text-[#4d8dff]">Privacy Statement</span>.
          </p>
        </form>
      </div>
    </div>
  );
}
