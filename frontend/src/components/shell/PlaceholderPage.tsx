import type { LucideIcon } from "lucide-react";

export function PlaceholderPage({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zoom-blue-soft text-zoom-blue">
        <Icon className="h-7 w-7" />
      </span>
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
      <p className="max-w-sm text-sm text-muted">{text}</p>
    </div>
  );
}
