"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface LocalMedia {
  /** True once the initial mic/camera setup has finished (granted or not). */
  ready: boolean;
  audioTrack: MediaStreamTrack | null;
  /** Camera track (null while the camera is off). */
  videoTrack: MediaStreamTrack | null;
  screenTrack: MediaStreamTrack | null;
  audioOn: boolean;
  videoOn: boolean;
  sharing: boolean;
  micBlocked: boolean;
  camBlocked: boolean;
  /** Ask the browser for mic / camera access again (shows its permission prompt). Resolves to success. */
  requestMic: () => Promise<boolean>;
  requestCamera: () => Promise<boolean>;
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleShare: () => Promise<void>;
  forceMute: () => void;
  forceVideoOff: () => void;
  forceShareOff: () => void;
  stopAll: () => void;
}

const VIDEO_CONSTRAINTS: MediaTrackConstraints = { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" };

/** getUserMedia that rejects (rather than throws) when the API is unavailable, e.g. on plain http. */
function requestMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return Promise.reject(new Error("Media devices are not available"));
  }
  return navigator.mediaDevices.getUserMedia(constraints);
}

/**
 * Owns the local microphone, camera and screen-share tracks.
 * - Mute toggles `track.enabled` (through `micRef`), so the mic is not re-prompted.
 * - Turning video off stops the camera track entirely, so the camera light goes off.
 * - Denied permissions are reported instead of thrown, so a user can still join.
 */
export function useLocalMedia(initial: { audioOn: boolean; videoOn: boolean }): LocalMedia {
  const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [screenTrack, setScreenTrack] = useState<MediaStreamTrack | null>(null);
  const [audioOn, setAudioOn] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);
  const [camBlocked, setCamBlocked] = useState(false);
  const [ready, setReady] = useState(false);
  // Mutable handle to the mic track (state values must not be mutated).
  const micRef = useRef<MediaStreamTrack | null>(null);
  const owned = useRef<Set<MediaStreamTrack>>(new Set());

  const acquireMic = useCallback(async (enabled: boolean): Promise<boolean> => {
    try {
      const stream = await requestMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mic = stream.getAudioTracks()[0];
      owned.current.add(mic);
      mic.enabled = enabled;
      micRef.current = mic;
      setAudioTrack(mic);
      setAudioOn(enabled);
      setMicBlocked(false);
      return true;
    } catch {
      setMicBlocked(true);
      setAudioOn(false);
      return false;
    }
  }, []);

  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await requestMedia({ video: VIDEO_CONSTRAINTS });
      const camera = stream.getVideoTracks()[0];
      owned.current.add(camera);
      setVideoTrack(camera);
      setCamBlocked(false);
      return true;
    } catch {
      setCamBlocked(true);
      return false;
    }
  }, []);

  const requestMic = useCallback(() => acquireMic(true), [acquireMic]);

  useEffect(() => {
    const tracks = owned.current;
    // State is only set after getUserMedia resolves, so this does not render synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    Promise.all([acquireMic(initial.audioOn), initial.videoOn ? startCamera() : true]).then(() => setReady(true));
    return () => tracks.forEach((t) => t.stop());
    // Only on mount: later changes go through the toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleAudio = useCallback(async () => {
    const mic = micRef.current;
    if (!mic) {
      await acquireMic(true);
      return;
    }
    mic.enabled = !mic.enabled;
    setAudioOn(mic.enabled);
  }, [acquireMic]);

  const toggleVideo = useCallback(async () => {
    if (!videoTrack) {
      await startCamera();
      return;
    }
    videoTrack.stop();
    setVideoTrack(null);
  }, [videoTrack, startCamera]);

  const stopShare = useCallback(() => {
    setScreenTrack((current) => {
      current?.stop();
      return null;
    });
  }, []);

  const toggleShare = useCallback(async () => {
    if (screenTrack) return stopShare();
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screen = stream.getVideoTracks()[0];
      owned.current.add(screen);
      screen.addEventListener("ended", stopShare); // the browser's own "Stop sharing" button
      setScreenTrack(screen);
    } catch {
      // User cancelled the picker.
    }
  }, [screenTrack, stopShare]);

  const forceMute = useCallback(() => {
    if (micRef.current) micRef.current.enabled = false;
    setAudioOn(false);
  }, []);

  const forceVideoOff = useCallback(() => {
    setVideoTrack((current) => {
      current?.stop();
      return null;
    });
  }, []);

  const stopAll = useCallback(() => {
    owned.current.forEach((t) => t.stop());
    owned.current.clear();
  }, []);

  return {
    ready,
    audioTrack,
    videoTrack,
    screenTrack,
    audioOn,
    videoOn: !!videoTrack,
    sharing: !!screenTrack,
    micBlocked,
    camBlocked,
    requestMic,
    requestCamera: startCamera,
    toggleAudio,
    toggleVideo,
    toggleShare,
    forceMute,
    forceVideoOff,
    forceShareOff: stopShare,
    stopAll,
  };
}
