import { useSyncExternalStore } from "react";

// One shared ticking clock for every subscriber.
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** Current time, ticking every second. Null during server render so hydration matches. */
export function useNow(): Date | null {
  const value = useSyncExternalStore(subscribe, () => now, () => null);
  return value === null ? null : new Date(value);
}
