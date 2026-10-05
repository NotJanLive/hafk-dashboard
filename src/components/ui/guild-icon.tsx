import Image from "next/image";
import { initials } from "@/lib/discord/cdn";
import { cn } from "@/lib/utils";

export function GuildIcon({
  name,
  iconUrl,
  size = 40,
  className,
}: {
  name: string;
  iconUrl: string | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (iconUrl) {
    return (
      <Image
        src={iconUrl}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-[30%] bg-surface-3 object-cover", className)}
        style={style}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{ ...style, fontSize: Math.max(10, size * 0.36) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[30%] border border-line-strong bg-surface-3 font-mono font-bold text-muted",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
