import { type RefObject, useEffect, useState } from "react";

/** True after `ms` without pointer/keyboard activity inside `ref` (used to auto-hide meeting controls). */
export function useIdle(ref: RefObject<HTMLElement | null>, ms = 3000, disabled = false): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) {
      setIdle(false);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), ms);
    };
    wake();
    const events = ["pointermove", "pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => el.addEventListener(e, wake));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => el.removeEventListener(e, wake));
    };
  }, [ref, ms, disabled]);
  return idle;
}
