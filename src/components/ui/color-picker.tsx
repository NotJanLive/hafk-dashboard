"use client";

import { Check } from "lucide-react";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { clamp01, type Hsv, hsvToInt, intToHsv } from "@/lib/color";
import { colorToHex, DEFAULT_COLOR, hexToColor } from "@/lib/embeds/payload";
import { cn } from "@/lib/utils";

const PRESETS = [
  0x5b6cff, 0x5865f2, 0x3498db, 0x1abc9c, 0x2fbf71, 0x57f287, 0xfee75c, 0xf5a524, 0xe67e22, 0xed4245, 0xeb459e,
  0x9b59b6, 0xffffff, 0x99aab5, 0x4e5058, 0x2b2d31,
];

function useDrag(onMove: (x: number, y: number) => void) {
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onMove(clamp01((event.clientX - rect.left) / rect.width), clamp01((event.clientY - rect.top) / rect.height));
  };
  return {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      move(event);
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event);
    },
  };
}

export function ColorPicker({
  value,
  onChange,
  label = "Farbe wählen",
}: {
  value: number | undefined;
  onChange: (color: number) => void;
  label?: string;
}) {
  const current = value ?? DEFAULT_COLOR;
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState<Hsv>(() => intToHsv(current));
  const [hexText, setHexText] = useState(colorToHex(current));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const applyHsv = (next: Hsv) => {
    const color = hsvToInt(next);
    setHsv(next);
    setHexText(colorToHex(color));
    onChange(color);
  };

  const applyColor = (color: number) => {
    setHsv(intToHsv(color));
    setHexText(colorToHex(color));
    onChange(color);
  };

  const toggle = () => {
    if (!open) {
      setHsv(intToHsv(current));
      setHexText(colorToHex(current));
    }
    setOpen(!open);
  };

  const area = useDrag((x, y) => applyHsv({ ...hsv, s: x, v: 1 - y }));
  const hue = useDrag((x) => applyHsv({ ...hsv, h: x * 360 }));

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          "flex h-10 w-full items-center rounded-[10px] border border-border-strong bg-surface-2 pr-1 transition-colors focus-within:border-primary hover:border-faint",
          open && "border-primary",
        )}
      >
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={label}
          className="flex h-full min-w-0 flex-1 items-center gap-2.5 pl-2 focus:outline-none"
        >
          <span
            className="size-6 shrink-0 rounded-md ring-1 ring-white/10"
            style={{ background: colorToHex(current) }}
          />
          <span className="font-mono text-xs text-muted uppercase">{colorToHex(current)}</span>
        </button>
        <CopyButton value={colorToHex(current).toUpperCase()} className="size-7" />
      </div>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-2 w-64 rounded-xl border border-border-strong bg-surface-2 p-3 shadow-2xl shadow-black/50">
          <div
            {...area}
            className="relative h-36 cursor-crosshair touch-none rounded-lg"
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
            }}
          >
            <span
              className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md shadow-black/50"
              style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: colorToHex(hsvToInt(hsv)) }}
            />
          </div>

          <div
            {...hue}
            className="relative mt-3 h-3 cursor-pointer touch-none rounded-full"
            style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
          >
            <span
              className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md shadow-black/50"
              style={{ left: `${(hsv.h / 360) * 100}%`, background: `hsl(${hsv.h} 100% 50%)` }}
            />
          </div>

          <div className="mt-3 grid grid-cols-8 gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyColor(preset)}
                aria-label={colorToHex(preset)}
                className="flex size-6 items-center justify-center rounded-md ring-1 ring-white/10 transition-transform hover:scale-110"
                style={{ background: colorToHex(preset) }}
              >
                {preset === current && (
                  <Check className={cn("size-3.5", preset > 0xaaaaaa ? "text-black" : "text-white")} />
                )}
              </button>
            ))}
          </div>

          <label className="mt-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-muted">Hex</span>
            <input
              value={hexText}
              onChange={(event) => {
                setHexText(event.target.value);
                const parsed = hexToColor(event.target.value);
                if (parsed !== undefined) {
                  setHsv(intToHsv(parsed));
                  onChange(parsed);
                }
              }}
              maxLength={7}
              spellCheck={false}
              className="h-8 w-full rounded-lg border border-border-strong bg-surface px-2 font-mono text-xs uppercase focus:border-primary focus:outline-none"
            />
            <CopyButton value={colorToHex(current).toUpperCase()} variant="secondary" />
          </label>
        </div>
      )}
    </div>
  );
}
