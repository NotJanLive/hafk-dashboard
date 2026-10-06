import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoImage({
  size = 36,
  className,
  priority,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/logo.webp"
      alt="HAFK-Bot"
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/servers" className={cn("flex items-center gap-3", className)}>
      <LogoImage size={38} priority />
      <span className="leading-tight">
        <span className="block text-[15px] font-bold tracking-tight">HAFK-Bot</span>
        <span className="block text-xs font-medium text-faint">Dashboard</span>
      </span>
    </Link>
  );
}
