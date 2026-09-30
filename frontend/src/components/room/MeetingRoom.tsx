"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { useIdle } from "@/hooks/useIdle";
import { useLatest } from "@/hooks/useLatest";
import { useLocalMedia } from "@/hooks/useLocalMedia";
import { useMeetingSocket } from "@/hooks/useMeetingSocket";
import { useWebRTCMesh } from "@/hooks/useWebRTCMesh";
import { api, meetingSocketUrl } from "@/lib/api";
import { cn } from "@/lib/cn";
import { omitKey } from "@/lib/omit";
import { clearRoomSession, type RoomSession, saveRoomSession } from "@/lib/session";
import {
  type ChatMessage,
  type ClientMessage,
  DEFAULT_ROOM_SETTINGS,
  type PeerInfo,
  type RoomSettings,
  type ServerMessage,
} from "@/types/api";
import { ChatPanel } from "./ChatPanel";
import { ControlBar, type RoomPanel } from "./ControlBar";
import { HostToolsPanel, type HostToolsView } from "./HostToolsPanel";
import { InviteDialog } from "./InviteDialog";
import { MeetingExitScreen } from "./MeetingExitScreen";
import { MiniMeetingView } from "./MiniMeetingView";
import { ParticipantsPanel } from "./ParticipantsPanel";
import { PermissionBanner } from "./PermissionBanner";
import { type FloatingReaction, ReactionsOverlay } from "./ReactionsOverlay";
import { RemoteAudio } from "./RemoteAudio";
import { RenameDialog } from "./RenameDialog";
import { RoomHeader } from "./RoomHeader";
import { pickSpeaker, type RoomView, type StageParticipant, VideoGrid } from "./VideoGrid";
import { WaitingRoomScreen } from "./WaitingRoomScreen";

const MAX_RECONNECTS = 5;
// Close codes sent by the server when a session can no longer be used.
const SESSION_INVALID = 4404;
const SESSION_REPLACED = 4409;

interface MeetingRoomProps {
  code: string;
  session: RoomSession;
  /** "full" on the meeting page; "mini" while the user browses Workplace. */
  mode: "full" | "mini";
  /** Called once the user is out of the meeting (left, removed, or it ended). */
  onExit: () => void;
}

export function MeetingRoom({ code, session, mode, onExit }: MeetingRoomProps) {
  const router = useRouter();
  const toast = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: meeting } = useAsync(() => api.getMeeting(session.meetingId), [session.meetingId]);
  const media = useLocalMedia({
    audioOn: !session.audioMuted,
    videoOn: session.videoOn,
  });

  const [self, setSelf] = useState<PeerInfo | null>(null);
  const [peers, setPeers] = useState<Record<string, PeerInfo>>({});
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [panel, setPanel] = useState<RoomPanel | null>(null);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [exitReason, setExitReason] = useState<"ended" | "removed" | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<PeerInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_ROOM_SETTINGS);
  // Guests start out waiting if the host enabled the waiting room.
  const [inWaitingRoom, setInWaitingRoom] = useState(false);
  const [waitingPeers, setWaitingPeers] = useState<PeerInfo[]>([]);
  const [renameTarget, setRenameTarget] = useState<PeerInfo | null>(null);
  const [hostToolsView, setHostToolsView] = useState<HostToolsView>("main");
  const [view, setView] = useState<RoomView>("speaker");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const leavingRef = useRef(false);
  const panelRef = useLatest(panel);
  const modeRef = useLatest(mode);

  // The mesh needs `send` and the socket handler needs the mesh; a stable relay breaks the cycle.
  const sendRef = useRef<(message: ClientMessage) => void>(() => {});
  const relay = useCallback((message: ClientMessage) => sendRef.current(message), []);
  const outgoingVideo = media.screenTrack ?? media.videoTrack;
  const mesh = useWebRTCMesh({
    send: relay,
    audioTrack: media.audioTrack,
    videoTrack: outgoingVideo,
  });

  const isHost = session.role === "host";
  const socketUrl = exitReason
    ? null
    : `${meetingSocketUrl(session.meetingId, session.participantId)}&attempt=${attempt}`;

  const { stopAll } = media;
  const leave = useCallback(() => {
    leavingRef.current = true;
    stopAll();
    clearRoomSession(code);
    onExit();
    // From the mini window the user stays on whatever Workplace page they are on.
    if (modeRef.current === "full") router.replace("/home");
  }, [code, stopAll, router, onExit, modeRef]);

  const handleMessage = (message: ServerMessage) => {
    switch (message.type) {
      case "waiting":
        setReconnecting(false);
        setInWaitingRoom(true);
        break;
      case "room-state":
        setReconnecting(false);
        setInWaitingRoom(false);
        setWaitingPeers(message.waiting ?? []);
        setSelf(message.self);
        setPeers(Object.fromEntries(message.peers.map((p) => [p.id, p])));
        setChat(message.chat);
        setSettings(message.settings);
        // The newcomer calls everyone already in the room.
        message.peers.forEach((p) => mesh.connectTo(p.id));
        break;
      case "peer-joined":
        setPeers((all) => ({ ...all, [message.peer.id]: message.peer }));
        break;
      case "peer-updated":
        if (message.peer.id === session.participantId) setSelf(message.peer);
        else setPeers((all) => (all[message.peer.id] ? { ...all, [message.peer.id]: message.peer } : all));
        break;
      case "peer-left":
        mesh.removePeer(message.peer_id);
        setPeers((all) => omitKey(all, message.peer_id));
        break;
      case "signal":
        mesh.handleSignal(message.from, message.data);
        break;
      case "chat":
        setChat((all) => [...all, message.message]);
        if (panelRef.current !== "chat") setUnread((n) => n + 1);
        break;
      case "reaction": {
        const reaction = {
          id: Date.now() + Math.random(),
          emoji: message.emoji,
          name: message.name,
        };
        setReactions((all) => [...all, reaction]);
        setTimeout(() => setReactions((all) => all.filter((r) => r !== reaction)), 3000);
        break;
      }
      case "room-settings":
        setSettings(message.settings);
        break;
      case "waiting-list":
        if (message.peers.length > waitingPeers.length) {
          toast(`${message.peers.at(-1)?.name} entered the waiting room`);
        }
        setWaitingPeers(message.peers);
        break;
      case "force-video-off":
        media.forceVideoOff();
        toast(message.reason);
        break;
      case "force-share-off":
        media.forceShareOff();
        toast(message.reason);
        break;
      case "force-mute":
        media.forceMute();
        toast(message.reason ?? "The host muted you");
        break;
      case "removed":
        setExitReason("removed");
        break;
      case "meeting-ended":
        if (isHost) leave();
        else setExitReason("ended");
        break;
      case "error":
        toast(message.message, "error");
        break;
    }
  };

  const handleClose = (closeCode: number) => {
    if (leavingRef.current || exitReason || closeCode === SESSION_REPLACED) return;
    mesh.closeAll();
    setPeers({});
    if (closeCode === SESSION_INVALID || attempt >= MAX_RECONNECTS) {
      clearRoomSession(code);
      toast("This meeting is no longer available", "error");
      router.replace("/home");
      return;
    }
    // Network blip / server restart: the server lets this session resume.
    setReconnecting(true);
    setTimeout(() => setAttempt((n) => n + 1), 1500);
  };

  const send = useMeetingSocket(socketUrl, handleMessage, handleClose);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  // Tell everyone about our mic/camera/share state whenever it changes (and once connected).
  // Remember the current mic/camera choice, so a page refresh restores what the user last had
  // rather than the choice made on the join screen. Waits for the initial device setup, whose
  // interim "not acquired yet" state would otherwise overwrite the saved choice.
  useEffect(() => {
    if (!media.ready || leavingRef.current || exitReason) return;
    saveRoomSession(code, { ...session, audioMuted: !media.audioOn, videoOn: media.videoOn });
  }, [media.ready, media.audioOn, media.videoOn, code, session, exitReason]);

  const connected = self !== null;
  useEffect(() => {
    if (connected)
      send({
        type: "media-state",
        audio_muted: !media.audioOn,
        video_on: media.videoOn,
        sharing: media.sharing,
      });
  }, [connected, media.audioOn, media.videoOn, media.sharing, send, attempt]);

  const { closeAll } = mesh;
  useEffect(() => {
    if (!exitReason) return;
    stopAll();
    closeAll();
    clearRoomSession(code);
    // Minimized: no room for the exit screen, so explain with a toast and close the window.
    if (modeRef.current === "mini") {
      toast(
        exitReason === "ended" ? "The meeting has been ended by the host" : "You were removed from the meeting",
        "error",
      );
      onExit();
    }
  }, [exitReason, stopAll, closeAll, code, modeRef, toast, onExit]);

  useEffect(() => {
    if (meeting) document.title = `${meeting.topic} - Zoom`;
    return () => {
      document.title = "Zoom Workplace";
    };
  }, [meeting]);

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const idle = useIdle(containerRef, 3000, panel !== null || menuOpen || !connected || mode === "mini");

  const exitToHome = () => {
    onExit();
    router.replace("/home");
  };
  if (exitReason) return mode === "full" ? <MeetingExitScreen reason={exitReason} onDone={exitToHome} /> : null;
  if (inWaitingRoom && mode === "full") return <WaitingRoomScreen topic={meeting?.topic} onLeave={leave} />;

  // Local state wins for our own tile so toggles feel instant.
  const selfView: PeerInfo | null = self && {
    ...self,
    audio_muted: !media.audioOn,
    video_on: media.videoOn,
    sharing: media.sharing,
  };
  const peerList = Object.values(peers);
  const stage: StageParticipant[] = [
    ...(selfView ? [{ peer: selfView, videoTrack: outgoingVideo, isSelf: true }] : []),
    ...peerList.map((peer) => ({
      peer,
      videoTrack: mesh.remoteStreams[peer.id]?.getVideoTracks()[0] ?? null,
      isSelf: false,
    })),
  ];

  const copyText = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${what} copied to clipboard`);
    } catch {
      toast("Could not access the clipboard", "error");
    }
  };
  const copyInvite = () => meeting && copyText(meeting.invite_link, "Invite link");
  const openHostTools = (initial: HostToolsView) => {
    setHostToolsView(initial);
    setPanel("host-tools");
  };

  const togglePanel = (next: RoomPanel) => {
    if (next === "host-tools") setHostToolsView("main");
    setPanel((current) => (current === next ? null : next));
    if (next === "chat") setUnread(0);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current?.requestFullscreen?.();
  };

  const showBanner = (media.micBlocked || media.camBlocked) && !bannerDismissed;
  // What the host's permissions stop *this* participant from doing (hosts are never restricted).
  const audioLocked = !isHost && !settings.allow_unmute;
  const videoLocked = !isHost && !settings.allow_video;
  const shareLocked = !isHost && !settings.allow_share;
  // Single-share mode: can I start while someone else is presenting?
  const someoneElseSharing = Object.values(peers).some((p) => p.sharing);
  const takeoverLocked =
    settings.share_mode === "single" && someoneElseSharing && !isHost && settings.share_takeover === "host";
  const chatLocked = !isHost && !settings.allow_chat;

  const blocked = (message: string) => toast(message, "error");
  const muteAll = () => {
    send({ type: "mute-all" });
    toast("All participants muted");
  };

  // Re-asks the browser for access. If the user previously chose "Block", browsers
  // won't show the prompt again, so explain where to re-enable it instead.
  const requestDevice = async (device: "microphone" | "camera") => {
    const granted = device === "microphone" ? await media.requestMic() : await media.requestCamera();
    if (!granted) {
      toast(
        `${device === "microphone" ? "Microphone" : "Camera"} access is blocked. Allow it from the site settings icon in the address bar.`,
        "error",
      );
    }
  };

  const toggleAudio = () => {
    if (audioLocked && !media.audioOn) return blocked("The host has disabled unmuting");
    return media.micBlocked ? requestDevice("microphone") : media.toggleAudio();
  };
  const toggleVideo = () => {
    if (videoLocked && !media.videoOn) return blocked("The host has disabled participant video");
    return media.camBlocked ? requestDevice("camera") : media.toggleVideo();
  };
  const toggleShare = () => {
    if (shareLocked && !media.sharing) return blocked("The host has disabled screen sharing");
    if (takeoverLocked && !media.sharing)
      return blocked("You cannot start sharing while another participant is sharing");
    return media.toggleShare();
  };

  // Kept outside the full/mini branches so switching views never restarts anyone's audio.
  const remoteAudio = (
    <div hidden>
      {peerList.map((peer) => {
        const audio = mesh.remoteStreams[peer.id]?.getAudioTracks()[0];
        return audio ? <RemoteAudio key={peer.id} track={audio} /> : null;
      })}
    </div>
  );

  if (mode === "mini") {
    return (
      <>
        <MiniMeetingView
          speaker={stage.length ? pickSpeaker(stage) : undefined}
          hideProfilePictures={settings.hide_profile_pictures}
          audioOn={media.audioOn}
          videoOn={media.videoOn}
          statusText={inWaitingRoom ? "Waiting for the host to let you in" : undefined}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onExpand={() => router.push(`/wc/${code}`)}
          onLeave={leave}
        />
        {remoteAudio}
      </>
    );
  }

  return (
    <>
      <div ref={containerRef} className={cn("relative flex h-full bg-stage", idle && "cursor-none")}>
        {/* Header, stage and control bar share one column; side panels sit to its right at full
            height (as in Zoom), so the bar — and its End/Leave menu — never runs under a panel. */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <RoomHeader
            meeting={meeting}
            hidden={idle}
            fullscreen={fullscreen}
            onToggleFullscreen={toggleFullscreen}
            onCopyInvite={copyInvite}
            view={view}
            onViewChange={setView}
          />

          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 transition-[padding] duration-300",
              idle ? "py-0" : "pt-12 pb-16",
            )}
          >
            <div className="relative flex min-w-0 flex-1 items-center justify-center">
              {showBanner && (
                <PermissionBanner
                  mic={media.micBlocked}
                  camera={media.camBlocked}
                  onRequestMic={() => requestDevice("microphone")}
                  onRequestCamera={() => requestDevice("camera")}
                  onDismiss={() => setBannerDismissed(true)}
                />
              )}
              {reconnecting && (
                <div className="absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-black px-4 py-2 text-sm text-white">
                  Reconnecting…
                </div>
              )}
              {stage.length > 0 ? (
                <VideoGrid participants={stage} view={view} hideProfilePictures={settings.hide_profile_pictures} />
              ) : (
                <p className="text-sm text-white/70">Connecting to meeting…</p>
              )}
              <ReactionsOverlay reactions={reactions} />
            </div>
          </div>

          <ControlBar
            audioOn={media.audioOn}
            videoOn={media.videoOn}
            sharing={media.sharing}
            micBlocked={media.micBlocked}
            camBlocked={media.camBlocked}
            isHost={isHost}
            participantCount={stage.length}
            unreadChat={unread}
            panel={panel}
            hidden={idle}
            audioLocked={audioLocked}
            videoLocked={videoLocked}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onToggleShare={toggleShare}
            onTogglePanel={togglePanel}
            onOpenShareSettings={() => openHostTools("share")}
            onOpenParticipantSettings={() => openHostTools("participants")}
            onInvite={() => setInviteOpen(true)}
            onReact={(emoji) => send({ type: "reaction", emoji })}
            onMuteAll={muteAll}
            onCopyInvite={copyInvite}
            onLeave={leave}
            onEndForAll={() => send({ type: "end-meeting" })}
            onMenuChange={setMenuOpen}
          />
        </div>

        {panel === "participants" && selfView && (
          <ParticipantsPanel
            self={selfView}
            peers={peerList}
            waiting={waitingPeers}
            isHost={isHost}
            canRenameSelf={isHost || settings.allow_rename}
            hideProfilePictures={settings.hide_profile_pictures}
            onClose={() => setPanel(null)}
            onMute={(target) => send({ type: "mute", target })}
            onMuteAll={muteAll}
            onRemove={setRemoveTarget}
            onRename={setRenameTarget}
            onAdmit={(target) => send({ type: "admit", target })}
            onAdmitAll={() => send({ type: "admit-all" })}
            onDeny={(target) => send({ type: "deny", target })}
            onInvite={() => setInviteOpen(true)}
          />
        )}
        {panel === "chat" && selfView && (
          <ChatPanel
            title={meeting?.topic ?? "Meeting Chat"}
            messages={chat}
            self={selfView}
            peers={peerList}
            disabled={chatLocked}
            onSend={(body, to) => send({ type: "chat", body, to })}
            onClose={() => setPanel(null)}
          />
        )}
        {panel === "host-tools" && isHost && (
          <HostToolsPanel
            key={hostToolsView}
            initialView={hostToolsView}
            settings={settings}
            onChange={(changes) => send({ type: "update-settings", settings: changes })}
            onSuspend={() => send({ type: "suspend" })}
            onMuteAll={muteAll}
            onClose={() => setPanel(null)}
          />
        )}

        <InviteDialog meeting={meeting} open={inviteOpen} onClose={() => setInviteOpen(false)} onCopy={copyText} />

        <RenameDialog
          currentName={renameTarget?.name ?? null}
          onCancel={() => setRenameTarget(null)}
          onSave={(name) => {
            if (renameTarget) {
              send({
                type: "rename",
                name,
                target: renameTarget.id === self?.id ? undefined : renameTarget.id,
              });
            }
            setRenameTarget(null);
          }}
        />

        <ConfirmDialog
          open={!!removeTarget}
          title={`Remove ${removeTarget?.name ?? ""}?`}
          message="They will be removed from the meeting and will not be able to rejoin with this session."
          confirmLabel="Remove"
          danger
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() => {
            if (removeTarget) send({ type: "remove", target: removeTarget.id });
            setRemoveTarget(null);
          }}
        />
      </div>
      {remoteAudio}
    </>
  );
}
