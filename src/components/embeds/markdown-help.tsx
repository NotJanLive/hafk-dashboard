"use client";

import { Check, Copy, Type } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useCopy } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

const mention = "rounded bg-[#5865f24d] px-0.5 font-medium text-[#c9cdfb]";

const GROUPS: { title: string; items: { syntax: string; result: ReactNode }[] }[] = [
  {
    title: "Text",
    items: [
      { syntax: "**fett**", result: <strong>fett</strong> },
      { syntax: "*kursiv*", result: <em>kursiv</em> },
      { syntax: "__unterstrichen__", result: <u>unterstrichen</u> },
      { syntax: "~~durchgestrichen~~", result: <s>durchgestrichen</s> },
      {
        syntax: "||Spoiler||",
        result: (
          <span className="rounded bg-[#1e1f22] px-1 text-[#1e1f22] transition-colors hover:text-text">Spoiler</span>
        ),
      },
      {
        syntax: "`Code`",
        result: <code className="rounded bg-[#1e1f22] px-1 py-0.5 font-mono text-[0.85em]">Code</code>,
      },
    ],
  },
  {
    title: "Absätze",
    items: [
      { syntax: "# Überschrift", result: <span className="text-base font-bold">Überschrift</span> },
      { syntax: "## Kleiner", result: <span className="text-[15px] font-bold">Kleiner</span> },
      { syntax: "> Zitat", result: <span className="border-l-4 border-[#4e5058] pl-2">Zitat</span> },
      { syntax: "- Listenpunkt", result: <span>• Listenpunkt</span> },
      { syntax: "-# Kleingedrucktes", result: <span className="text-xs text-faint">Kleingedrucktes</span> },
    ],
  },
  {
    title: "Links & Erwähnungen",
    items: [
      { syntax: "[Text](https://…)", result: <span className="text-[#00a8fc]">Text</span> },
      { syntax: "<@&Rollen-ID>", result: <span className={mention}>@Rolle</span> },
      { syntax: "<#Kanal-ID>", result: <span className={mention}>#kanal</span> },
      { syntax: "<@Nutzer-ID>", result: <span className={mention}>@Nutzer</span> },
      { syntax: "<t:1767225600:R>", result: <span className="rounded bg-[#ffffff0f] px-1">relative Zeit</span> },
    ],
  },
];

function SyntaxRow({ syntax, result }: { syntax: string; result: ReactNode }) {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        copy(syntax);
      }}
      title="Zum Kopieren klicken"
      className="group grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_16px] items-center gap-3 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-surface-3"
    >
      <code className="truncate font-mono text-xs text-muted">{syntax}</code>
      <span className="truncate text-sm text-[#dbdee1]">{result}</span>
      {copied ? (
        <Check className="size-4 text-success" />
      ) : (
        <Copy className="size-3.5 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
}

export function MarkdownHelp() {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!pinned) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) {
        setPinned(false);
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [pinned]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const show = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    if (pinned) return;
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div ref={ref} className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          setPinned(!pinned);
          setOpen(!pinned);
        }}
        aria-expanded={open}
        className={cn(
          "inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-faint transition-colors hover:bg-surface-3 hover:text-text",
          open && "bg-surface-3 text-text",
        )}
      >
        <Type className="size-3.5" />
        Formatierung
      </button>

      {open && (
        <div className="absolute top-full right-0 z-30 pt-2">
          <div className="w-[min(380px,calc(100vw-2rem))] rounded-xl border border-border-strong bg-surface-2 p-2 shadow-2xl shadow-black/50">
            <p className="px-2.5 pt-1 pb-2 text-xs text-faint">
              Discord-Markdown. Klicke auf eine Zeile, um die Schreibweise zu kopieren.
            </p>
            {GROUPS.map((group) => (
              <div key={group.title} className="border-t border-border pt-1.5 pb-1 first-of-type:border-t-0">
                <p className="px-2.5 pt-1 pb-1 text-[11px] font-bold tracking-wide text-faint uppercase">
                  {group.title}
                </p>
                {group.items.map((item) => (
                  <SyntaxRow key={item.syntax} syntax={item.syntax} result={item.result} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
