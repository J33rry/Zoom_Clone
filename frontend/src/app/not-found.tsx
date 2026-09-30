import type { Metadata } from "next";
import Link from "next/link";
import { AppChrome } from "@/components/shell/AppChrome";

export const metadata: Metadata = { title: "Page not found - Zoom" };

/** "404" with a camera-off lens for the zero, in the same palette as the empty-state illustration. */
function NotFoundIllustration() {
  return (
    <svg viewBox="0 0 260 120" className="h-[120px] w-[260px]" role="img" aria-label="404">
      <ellipse cx="130" cy="108" rx="96" ry="9" fill="#EEF0F8" />
      <g fill="none" stroke="#A8AEDC" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round">
        <path d="M62 92V22L22 72h56" />
        <path d="M228 92V22l-40 50h56" />
      </g>
      <circle cx="130" cy="57" r="35" fill="#fff" stroke="#A8AEDC" strokeWidth="13" />
      <g stroke="#0b5cff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <rect x="113" y="47" width="24" height="20" rx="4" />
        <path d="m137 54 10-6v18l-10-6" />
        <path d="M110 74 150 40" stroke="#fff" strokeWidth="9" />
        <path d="M110 74 150 40" />
      </g>
    </svg>
  );
}

export default function NotFound() {
  return (
    <AppChrome>
      <div className="flex h-full flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center">
        <NotFoundIllustration />
        <h1 className="mt-8 text-[28px] font-semibold tracking-[-0.01em] text-ink">This page isn&apos;t available</h1>
        <p className="mt-3 max-w-[420px] text-[15px] leading-6 text-muted">
          The link may be broken, or the page may have been moved or removed. Check the address, or head back to Home to start or
          join a meeting.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/home"
            className="inline-flex h-11 items-center rounded-lg bg-zoom-blue px-6 text-base font-semibold text-white transition-colors hover:bg-zoom-blue-hover"
          >
            Back to Home
          </Link>
          <Link
            href="/meetings"
            className="inline-flex h-11 items-center rounded-lg border border-line-strong bg-white px-6 text-base font-semibold text-ink transition-colors hover:bg-hover"
          >
            View Meetings
          </Link>
        </div>
        <p className="mt-10 text-[13px] text-subtle">Error code: 404</p>
      </div>
    </AppChrome>
  );
}
