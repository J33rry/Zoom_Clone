import type { ReactNode } from "react";
import { AppChrome } from "@/components/shell/AppChrome";

export default function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AppChrome>{children}</AppChrome>;
}
