"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { CurrentUserProvider } from "./CurrentUser";

/** Context shared by every page, with or without the Workplace chrome. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CurrentUserProvider>
      <ToastProvider>{children}</ToastProvider>
    </CurrentUserProvider>
  );
}
