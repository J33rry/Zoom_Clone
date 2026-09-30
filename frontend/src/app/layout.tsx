import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { MeetingDock } from "@/components/room/MeetingDock";
import { AppProviders } from "@/components/shell/AppProviders";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zoom Workplace",
  description: "A Zoom Workplace clone: meetings, scheduling and video calls.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full">
        <AppProviders>
          {children}
          {/* Lives above the routes so an ongoing meeting survives navigation. */}
          <MeetingDock />
        </AppProviders>
      </body>
    </html>
  );
}
