"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useCurrentUser } from "@/components/shell/CurrentUser";
import { useToast } from "@/components/ui/Toast";
import { activeMeeting } from "@/lib/activeMeeting";
import { api } from "@/lib/api";
import { saveRoomSession } from "@/lib/session";
import type { Meeting } from "@/types/api";

/** "Start" = join your own meeting as host, then open the meeting room. */
export function useStartMeeting() {
  const router = useRouter();
  const user = useCurrentUser();
  const toast = useToast();
  const [starting, setStarting] = useState(false);

  const enterAsHost = useCallback(
    async (meeting: Meeting, videoOn = meeting.host_video_on) => {
      const current = activeMeeting.get();
      if (current?.code === meeting.join_code) {
        // Already in this meeting (minimized): just bring it back.
        router.push(`/wc/${meeting.join_code}`);
        return;
      }
      if (current) throw new Error("You're already in a meeting. Leave it before starting another one.");
      const displayName = user?.name ?? meeting.host.name;
      const joined = await api.join(meeting.join_code, {
        display_name: displayName,
        as_host: true,
        audio_muted: false,
        video_on: videoOn,
      });
      saveRoomSession(meeting.join_code, {
        meetingId: joined.meeting.id,
        participantId: joined.participant_id,
        role: joined.role,
        displayName,
        audioMuted: false,
        videoOn,
      });
      router.push(`/wc/${meeting.join_code}`);
    },
    [router, user],
  );

  const run = useCallback(
    async (task: () => Promise<void>) => {
      setStarting(true);
      try {
        await task();
      } catch (err) {
        toast((err as Error).message, "error");
      } finally {
        setStarting(false);
      }
    },
    [toast],
  );

  const startMeeting = useCallback((meeting: Meeting) => run(() => enterAsHost(meeting)), [run, enterAsHost]);

  const startInstantMeeting = useCallback(
    (options: { usePmi: boolean; videoOn: boolean }) =>
      run(async () => {
        if (activeMeeting.get()) throw new Error("You're already in a meeting. Leave it before starting another one.");
        const meeting = await api.createInstant({ use_pmi: options.usePmi, video_on: options.videoOn });
        await enterAsHost(meeting, options.videoOn);
      }),
    [run, enterAsHost],
  );

  return { startMeeting, startInstantMeeting, starting };
}
