"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function useCopy() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = (text: string) =>
    navigator.clipboard.writeText(text).then(
      () => setCopied(true),
      () => toast.error("Kopieren hat nicht geklappt."),
    );

  return { copied, copy };
}

export function CopyButton({
  value,
  label,
  className,
  variant = "ghost",
  size = "sm",
}: {
  value: string;
  label?: string;
  className?: string;
  variant?: "ghost" | "secondary";
  size?: "sm" | "md";
}) {
  const { copied, copy } = useCopy();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => copy(value)}
      aria-label={label ?? "Kopieren"}
      title={copied ? "Kopiert" : "Kopieren"}
      className={cn(!label && "aspect-square px-0", copied && "text-success hover:text-success", className)}
    >
      {copied ? <Check /> : <Copy />}
      {label && (copied ? "Kopiert" : label)}
    </Button>
  );
}
