export interface FloatingReaction {
  id: number;
  emoji: string;
  name: string;
}

export const REACTIONS = ["👏", "👍", "❤️", "😂", "😮", "🎉"];

/** Emoji that drift up from the bottom-left of the stage, like Zoom's reactions. */
export function ReactionsOverlay({ reactions }: { reactions: FloatingReaction[] }) {
  return (
    <div className="pointer-events-none absolute bottom-20 left-6 z-10 h-72 w-40" aria-live="polite">
      {reactions.map((r, i) => (
        <div
          key={r.id}
          className="absolute bottom-0 flex animate-float-up flex-col items-center"
          style={{ left: `${(i * 37) % 90}px` }}
        >
          <span className="text-4xl">{r.emoji}</span>
          <span className="mt-0.5 rounded bg-black/60 px-1.5 text-[11px] text-white">{r.name}</span>
        </div>
      ))}
    </div>
  );
}
