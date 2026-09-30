"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { omitKey } from "@/lib/omit";
import type { ClientMessage, SignalData } from "@/types/api";
import { useLatest } from "./useLatest";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ...(process.env.NEXT_PUBLIC_TURN_URL
    ? [
        {
          urls: process.env.NEXT_PUBLIC_TURN_URL,
          username: process.env.NEXT_PUBLIC_TURN_USERNAME,
          credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
        },
      ]
    : []),
];

interface PeerConnection {
  pc: RTCPeerConnection;
  stream: MediaStream;
  /** ICE candidates that arrived before the remote description was set. */
  pendingIce: RTCIceCandidateInit[];
}

interface MeshOptions {
  send: (message: ClientMessage) => void;
  audioTrack: MediaStreamTrack | null;
  /** Whatever we should be sending as video: the screen share if active, else the camera. */
  videoTrack: MediaStreamTrack | null;
}

/**
 * Full-mesh WebRTC: one RTCPeerConnection per remote participant.
 *
 * - Only the *newcomer* creates offers (to everyone already in the room), so two
 *   peers never offer to each other at once ("glare").
 * - Each connection gets exactly one audio + one video transceiver up front. Muting,
 *   camera on/off and screen sharing are done with `replaceTrack`, which never needs
 *   renegotiation.
 */
export function useWebRTCMesh({ send, audioTrack, videoTrack }: MeshOptions) {
  const peers = useRef(new Map<string, PeerConnection>());
  const tracksRef = useLatest({ audio: audioTrack, video: videoTrack });
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  const attachLocalTracks = useCallback(
    (pc: RTCPeerConnection) => {
      for (const transceiver of pc.getTransceivers()) {
        const kind = transceiver.receiver.track.kind;
        const next = kind === "audio" ? tracksRef.current.audio : tracksRef.current.video;
        if (transceiver.sender.track !== next) transceiver.sender.replaceTrack(next).catch(() => {});
      }
    },
    [tracksRef],
  );

  const createPeer = useCallback(
    (peerId: string, initiator: boolean): PeerConnection => {
      peers.current.get(peerId)?.pc.close();
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const entry: PeerConnection = { pc, stream: new MediaStream(), pendingIce: [] };
      peers.current.set(peerId, entry);

      pc.onicecandidate = (event) => {
        if (event.candidate) send({ type: "signal", to: peerId, data: { kind: "ice", candidate: event.candidate.toJSON() } });
      };
      pc.ontrack = (event) => {
        entry.stream.addTrack(event.track);
        // New object so React re-renders tiles that depend on this stream.
        setRemoteStreams((streams) => ({ ...streams, [peerId]: new MediaStream(entry.stream.getTracks()) }));
      };
      if (initiator) {
        pc.addTransceiver("audio", { direction: "sendrecv" });
        pc.addTransceiver("video", { direction: "sendrecv" });
        attachLocalTracks(pc);
      }
      return entry;
    },
    [send, attachLocalTracks],
  );

  const flushIce = async (entry: PeerConnection) => {
    for (const candidate of entry.pendingIce.splice(0)) {
      await entry.pc.addIceCandidate(candidate).catch(() => {});
    }
  };

  /** Called by the newcomer for every peer already in the room. */
  const connectTo = useCallback(
    async (peerId: string) => {
      const { pc } = createPeer(peerId, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      send({ type: "signal", to: peerId, data: { kind: "offer", sdp: offer.sdp ?? "" } });
    },
    [createPeer, send],
  );

  const handleSignal = useCallback(
    async (from: string, data: SignalData) => {
      try {
        if (data.kind === "offer") {
          const entry = createPeer(from, false);
          await entry.pc.setRemoteDescription({ type: "offer", sdp: data.sdp });
          // Transceivers created from the offer default to recvonly; we want to send too.
          entry.pc.getTransceivers().forEach((t) => (t.direction = "sendrecv"));
          attachLocalTracks(entry.pc);
          const answer = await entry.pc.createAnswer();
          await entry.pc.setLocalDescription(answer);
          send({ type: "signal", to: from, data: { kind: "answer", sdp: answer.sdp ?? "" } });
          await flushIce(entry);
        } else if (data.kind === "answer") {
          const entry = peers.current.get(from);
          if (!entry) return;
          await entry.pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
          await flushIce(entry);
        } else if (data.kind === "ice") {
          const entry = peers.current.get(from);
          if (!entry) return;
          if (entry.pc.remoteDescription) await entry.pc.addIceCandidate(data.candidate).catch(() => {});
          else entry.pendingIce.push(data.candidate);
        }
      } catch (err) {
        console.error("WebRTC signalling failed", err);
      }
    },
    [createPeer, send, attachLocalTracks],
  );

  const removePeer = useCallback((peerId: string) => {
    peers.current.get(peerId)?.pc.close();
    peers.current.delete(peerId);
    setRemoteStreams((streams) => omitKey(streams, peerId));
  }, []);

  const closeAll = useCallback(() => {
    peers.current.forEach(({ pc }) => pc.close());
    peers.current.clear();
    setRemoteStreams((streams) => (Object.keys(streams).length ? {} : streams));
  }, []);

  // Swap outgoing tracks on every connection when mic/camera/screen changes.
  useEffect(() => {
    peers.current.forEach(({ pc }) => attachLocalTracks(pc));
  }, [audioTrack, videoTrack, attachLocalTracks]);

  useEffect(() => closeAll, [closeAll]);

  return { remoteStreams, connectTo, handleSignal, removePeer, closeAll };
}
