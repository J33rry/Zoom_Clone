import { Button } from "@/components/ui/Button";

/** Shown to participants until the host admits them. */
export function WaitingRoomScreen({ topic, onLeave }: { topic: string | undefined; onLeave: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-stage px-6 text-center">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" aria-hidden />
      <p className="text-lg font-medium text-white">Please wait, the meeting host will let you in soon.</p>
      {topic && <p className="text-sm text-white/60">{topic}</p>}
      <Button variant="secondary" onClick={onLeave} className="mt-4">
        Leave
      </Button>
    </div>
  );
}
