import { AlertTriangle, X } from "lucide-react";

interface PermissionBannerProps {
  mic: boolean;
  camera: boolean;
  onRequestMic: () => void;
  onRequestCamera: () => void;
  onDismiss: () => void;
}

/** "Please enable access to your microphone and camera…" — each device name re-requests access. */
export function PermissionBanner({ mic, camera, onRequestMic, onRequestCamera, onDismiss }: PermissionBannerProps) {
  const devices = [
    mic && { label: "microphone", onClick: onRequestMic },
    camera && { label: "camera", onClick: onRequestCamera },
  ].filter((d): d is { label: string; onClick: () => void } => !!d);

  return (
    <div className="absolute top-4 left-1/2 z-20 flex w-[min(600px,calc(100%-32px))] -translate-x-1/2 animate-fade-in items-center gap-3 rounded-xl bg-black px-4 py-3 text-[14px] text-white shadow-panel">
      <AlertTriangle className="h-4 w-4 shrink-0 fill-warning text-black" />
      <p className="flex-1">
        Please enable access to your{" "}
        {devices.map((d, i) => (
          <span key={d.label}>
            {i > 0 && " and "}
            <button type="button" onClick={d.onClick} className="text-[#5b9bff] underline hover:text-[#8bb8ff]">
              {d.label}
            </button>
          </span>
        ))}{" "}
        for the best experience.
      </p>
      <button aria-label="Dismiss" onClick={onDismiss} className="rounded p-0.5 hover:bg-white/10">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
