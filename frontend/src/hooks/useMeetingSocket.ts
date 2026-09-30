"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ClientMessage, ServerMessage } from "@/types/api";
import { useLatest } from "./useLatest";

/** One WebSocket per meeting session. Handlers are read through refs so they never go stale. */
export function useMeetingSocket(
  url: string | null,
  onMessage: (message: ServerMessage) => void,
  onClose: (code: number) => void,
) {
  const socketRef = useRef<WebSocket | null>(null);
  const messageRef = useLatest(onMessage);
  const closeRef = useLatest(onClose);

  useEffect(() => {
    if (!url) return;
    const ws = new WebSocket(url);
    socketRef.current = ws;
    ws.onmessage = (event) => {
      try {
        messageRef.current(JSON.parse(event.data) as ServerMessage);
      } catch (err) {
        console.error("Bad meeting message", err);
      }
    };
    ws.onclose = (event) => closeRef.current(event.code);
    return () => {
      ws.onclose = null;
      ws.close();
      socketRef.current = null;
    };
  }, [url, messageRef, closeRef]);

  return useCallback((message: ClientMessage) => {
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  }, []);
}
