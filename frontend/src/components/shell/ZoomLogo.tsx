export function ZoomLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 88 20" className={className} role="img" aria-label="Zoom">
      <text
        x="0"
        y="17.5"
        fill="#0B5CFF"
        style={{ font: "800 24px var(--font-inter), system-ui, sans-serif", letterSpacing: "-0.5px" }}
      >
        zoom
      </text>
    </svg>
  );
}
