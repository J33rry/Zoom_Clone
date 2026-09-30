/** The white glyphs drawn on the three Home action tiles. */

export function NewMeetingGlyph() {
  return (
    <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden>
      <rect x="3" y="8" width="15" height="12" rx="3" fill="white" />
      <path d="M19 12.5 25 9v10l-6-3.5z" fill="white" />
      <path d="M4 24 24 4" stroke="#FF6D22" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M4 24 24 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function JoinGlyph() {
  return (
    <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden>
      <rect x="4" y="4" width="20" height="20" rx="5" fill="white" />
      <path d="M14 9v10M9 14h10" stroke="#0B5CFF" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function ScheduleGlyph() {
  return (
    <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden>
      <rect x="4" y="5.5" width="20" height="19" rx="4" fill="white" />
      <rect x="8.5" y="3" width="2.4" height="5" rx="1.2" fill="white" />
      <rect x="17.1" y="3" width="2.4" height="5" rx="1.2" fill="white" />
      <rect x="4" y="9" width="20" height="1.6" fill="#0B5CFF" opacity="0.25" />
      <text x="14" y="21" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0B5CFF" fontFamily="system-ui, sans-serif">
        19
      </text>
    </svg>
  );
}

export function BackToMeetingGlyph() {
  return (
    <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden>
      <path d="M12 6 4 13l8 7v-4.5c5.5 0 9 1.6 12 6-.9-6.3-4.6-11-12-11.8z" fill="white" />
    </svg>
  );
}
