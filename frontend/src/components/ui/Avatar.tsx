import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  color?: string;
  size?: number;
  className?: string;
  /** Shows the green "available" presence dot used in the top bar. */
  presence?: boolean;
}

export function Avatar({ name, color = "#6E1E9A", size = 32, className, presence }: AvatarProps) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      <span
        className="flex h-full w-full items-center justify-center rounded-[28%] font-medium text-white select-none"
        style={{ backgroundColor: color, fontSize: size * 0.45 }}
        aria-hidden
      >
        {name.trim().charAt(0).toUpperCase() || "?"}
      </span>
      {presence && (
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-success" />
      )}
    </span>
  );
}
