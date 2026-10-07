"use client";

import {
  Apple,
  Car,
  Flag,
  Gamepad2,
  Hand,
  Heart,
  Lightbulb,
  type LucideIcon,
  PawPrint,
  Search,
  Smile,
  SmilePlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GuildIcon } from "@/components/ui/guild-icon";
import type { GuildEmoji } from "@/lib/bot-api/types";
import { customEmojiUrl, formatCustomEmoji, parseCustomEmoji } from "@/lib/discord/emoji";
import { EMOJI_GROUPS, loadUnicodeEmojis, type UnicodeEmoji } from "@/lib/discord/unicode-emojis";
import { cn } from "@/lib/utils";

const EMOJI_FONT = { fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif' };

const GROUP_ICONS: Record<number, LucideIcon> = {
  0: Smile,
  1: Hand,
  3: PawPrint,
  4: Apple,
  5: Car,
  6: Gamepad2,
  7: Lightbulb,
  8: Heart,
  9: Flag,
};

type Entry = { key: string; value: string; label: string; custom?: GuildEmoji; emoji?: string };
type Section = { id: string; label: string; entries: Entry[] };

function EmojiGlyph({ entry, className }: { entry: Entry; className?: string }) {
  if (entry.custom) {
    return (
      <img
        src={customEmojiUrl(entry.custom)}
        alt={`:${entry.custom.name}:`}
        loading="lazy"
        className={cn("object-contain", className)}
      />
    );
  }
  return (
    <span className={cn("leading-none", className)} style={EMOJI_FONT}>
      {entry.emoji}
    </span>
  );
}

export function EmojiValue({ value, className }: { value: string; className?: string }) {
  const custom = parseCustomEmoji(value);
  if (custom) {
    return (
      <img src={customEmojiUrl(custom)} alt={`:${custom.name}:`} className={cn("size-6 object-contain", className)} />
    );
  }
  return (
    <span className={cn("text-xl leading-none", className)} style={EMOJI_FONT}>
      {value}
    </span>
  );
}

export function EmojiPicker({
  value,
  onChange,
  serverEmojis,
  guild,
  align = "left",
  compact = false,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  serverEmojis: GuildEmoji[];
  guild: { name: string; iconUrl: string | null };
  align?: "left" | "right";
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [unicode, setUnicode] = useState<UnicodeEmoji[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [hovered, setHovered] = useState<Entry | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());

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

  useEffect(() => {
    if (!open || unicode) return;
    let cancelled = false;
    loadUnicodeEmojis().then(
      (emojis) => !cancelled && setUnicode(emojis),
      () => !cancelled && setFailed(true),
    );
    return () => {
      cancelled = true;
    };
  }, [open, unicode]);

  const sections = useMemo<Section[]>(() => {
    const result: Section[] = [];
    if (serverEmojis.length > 0) {
      result.push({
        id: "server",
        label: guild.name,
        entries: serverEmojis.map((emoji) => ({
          key: emoji.id,
          value: formatCustomEmoji(emoji),
          label: `:${emoji.name}:`,
          custom: emoji,
        })),
      });
    }
    for (const group of EMOJI_GROUPS) {
      const entries = (unicode ?? [])
        .filter((emoji) => emoji.group === group.id)
        .map((emoji) => ({ key: emoji.emoji, value: emoji.emoji, label: emoji.label, emoji: emoji.emoji }));
      if (entries.length > 0) result.push({ id: String(group.id), label: group.label, entries });
    }
    return result;
  }, [serverEmojis, unicode, guild.name]);

  const results = useMemo<Entry[] | null>(() => {
    const search = query.trim().toLowerCase().replaceAll(":", "");
    if (!search) return null;
    const custom = serverEmojis
      .filter((emoji) => emoji.name.toLowerCase().includes(search))
      .map((emoji) => ({ key: emoji.id, value: formatCustomEmoji(emoji), label: `:${emoji.name}:`, custom: emoji }));
    const native = (unicode ?? [])
      .filter((emoji) => emoji.search.includes(search))
      .map((emoji) => ({ key: emoji.emoji, value: emoji.emoji, label: emoji.label, emoji: emoji.emoji }));
    return [...custom, ...native];
  }, [query, serverEmojis, unicode]);

  const openPicker = () => {
    setQuery("");
    setHovered(null);
    setActiveSection(null);
    setOpen(true);
  };

  const choose = (entry: Entry) => {
    onChange(entry.value);
    setOpen(false);
  };

  const jumpTo = (id: string) => {
    const section = sectionRefs.current.get(id);
    scrollRef.current?.scrollTo({ top: section?.offsetTop ?? 0 });
    setActiveSection(id);
  };

  const onScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    let current: string | null = null;
    for (const section of sections) {
      const element = sectionRefs.current.get(section.id);
      if (element && element.offsetTop <= container.scrollTop + 8) current = section.id;
    }
    setActiveSection(current);
  };

  const grid = (entries: Entry[]) => (
    <div className="grid grid-cols-8 gap-0.5 px-2">
      {entries.map((entry) => (
        <button
          key={entry.key}
          type="button"
          onClick={() => choose(entry)}
          onMouseEnter={() => setHovered(entry)}
          onFocus={() => setHovered(entry)}
          aria-label={entry.label}
          className={cn(
            "flex aspect-square items-center justify-center rounded-lg transition-colors hover:bg-surface-3 focus-visible:bg-surface-3 focus-visible:outline-none",
            entry.value === value && "bg-primary-soft",
          )}
        >
          <EmojiGlyph entry={entry} className={entry.custom ? "size-7" : "text-[26px]"} />
        </button>
      ))}
    </div>
  );

  const preview = hovered ?? results?.[0] ?? sections[0]?.entries[0] ?? null;
  const loading = !unicode && !failed;

  return (
    <div ref={ref} className="relative">
      {compact ? (
        <div className="group relative size-10">
          <button
            type="button"
            onClick={() => (open ? setOpen(false) : openPicker())}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label={value ? "Emoji ändern" : "Emoji wählen"}
            title={value ? "Emoji ändern" : "Emoji wählen"}
            className="flex size-10 items-center justify-center rounded-[10px] border border-border-strong bg-surface-2 transition-colors hover:border-faint focus:border-primary focus:outline-none"
          >
            {value ? <EmojiValue value={value} /> : <SmilePlus className="size-5 text-faint" />}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Emoji entfernen"
              className="absolute -top-1.5 -right-1.5 hidden size-5 items-center justify-center rounded-full border border-border-strong bg-surface-3 text-faint group-focus-within:flex group-hover:flex hover:text-text"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex h-10 items-center rounded-[10px] border border-border-strong bg-surface-2 transition-colors focus-within:border-primary hover:border-faint">
          <button
            type="button"
            onClick={() => (open ? setOpen(false) : openPicker())}
            aria-expanded={open}
            aria-haspopup="dialog"
            className="flex h-full min-w-0 flex-1 items-center gap-2.5 px-3 text-left text-sm focus:outline-none"
          >
            {value ? (
              <>
                <EmojiValue value={value} />
                <span className="truncate text-muted">{parseCustomEmoji(value)?.name ?? "Emoji ändern"}</span>
              </>
            ) : (
              <>
                <SmilePlus className="size-5 text-faint" />
                <span className="text-faint">Emoji wählen</span>
              </>
            )}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Emoji entfernen"
              className="mr-1.5 rounded-md p-1 text-faint transition-colors hover:bg-surface-3 hover:text-text"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Emoji auswählen"
          className={cn(
            "absolute top-full z-30 mt-2 flex h-[420px] w-[364px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border-strong bg-surface-2 shadow-2xl shadow-black/50",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 text-faint" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Emojis suchen …"
              className="h-11 w-full bg-transparent text-sm placeholder:text-faint focus:outline-none"
            />
          </div>

          <div className="flex min-h-0 flex-1">
            {!results && (
              <nav className="flex w-12 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-border bg-surface py-2">
                {sections.map((section) => {
                  const Icon = GROUP_ICONS[Number(section.id)];
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => jumpTo(section.id)}
                      title={section.label}
                      aria-label={section.label}
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-surface-3 hover:text-text",
                        activeSection === section.id && "bg-surface-3 text-text",
                      )}
                    >
                      {section.id === "server" ? (
                        <GuildIcon name={guild.name} iconUrl={guild.iconUrl} size={24} />
                      ) : (
                        Icon && <Icon className="size-[18px]" />
                      )}
                    </button>
                  );
                })}
              </nav>
            )}

            <div ref={scrollRef} onScroll={onScroll} className="relative min-w-0 flex-1 overflow-y-auto pb-2">
              {results ? (
                results.length > 0 ? (
                  <div className="pt-2">{grid(results)}</div>
                ) : (
                  <p className="px-4 py-10 text-center text-sm text-faint">
                    {loading ? "Emojis werden geladen …" : "Keine Emojis gefunden"}
                  </p>
                )
              ) : (
                <>
                  {sections.map((section) => (
                    <section
                      key={section.id}
                      ref={(element) => {
                        if (element) sectionRefs.current.set(section.id, element);
                        else sectionRefs.current.delete(section.id);
                      }}
                    >
                      <h3 className="sticky top-0 z-10 bg-surface-2/95 px-3 pt-2.5 pb-1.5 text-[11px] font-bold tracking-wide text-faint uppercase backdrop-blur">
                        {section.label}
                      </h3>
                      {grid(section.entries)}
                    </section>
                  ))}
                  {loading && <p className="px-4 py-6 text-center text-sm text-faint">Emojis werden geladen …</p>}
                  {failed && (
                    <p className="px-4 py-6 text-center text-sm text-danger">Emojis konnten nicht geladen werden.</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex h-14 shrink-0 items-center gap-3 border-t border-border bg-surface px-4">
            {preview ? (
              <>
                <EmojiGlyph entry={preview} className={preview.custom ? "size-8" : "text-[28px]"} />
                <span className="truncate text-sm font-semibold">{preview.label}</span>
              </>
            ) : (
              <span className="text-sm text-faint">Fahre über ein Emoji</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
