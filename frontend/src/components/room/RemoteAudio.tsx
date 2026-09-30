"use client";

import { useEffect, useRef } from "react";

/** Plays one remote participant's audio; kept separate from video so it never stops when tiles re-layout. */
export function RemoteAudio({ track }: { track: MediaStreamTrack }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = new MediaStream([track]);
  }, [track]);
  return <audio ref={ref} autoPlay />;
}
