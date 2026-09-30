"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from "react";

type ToastKind = "success" | "error";
interface ToastState {
  id: number;
  message: string;
  kind: ToastKind;
}

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((message: string, kind: ToastKind = "success") => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, kind });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex justify-center px-4">
        {toast && (
          <div
            key={toast.id}
            className="flex animate-fade-in items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm text-white shadow-popover"
          >
            {toast.kind === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-[#4ade80]" />
            ) : (
              <AlertCircle className="h-4 w-4 text-[#f87171]" />
            )}
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
