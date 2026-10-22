"use client";

import { Check, Clock3, Filter, Hash, Search, Star, X } from "lucide-react";
import { Fragment, type ReactNode, useCallback, useMemo, useState } from "react";
import { DiscordMarkdown } from "@/components/discord/markdown";
import type { Channel, Role, Transcript, TranscriptEvent, TranscriptMessage } from "@/lib/bot-api/types";
import { cn } from "@/lib/utils";
import { colorOf, formatTime, type MessageContext, Separator, TranscriptMessageView } from "./transcript-message";

type Item =
  { kind: "message"; at: number; message: TranscriptMessage } | { kind: "event"; at: number; event: TranscriptEvent };

type Show = "messages" | "bot" | "internal" | "deleted" | "files";

const GROUP_WINDOW_MS = 7 * 60 * 1000;
const HIDDEN_SYSTEM = new Set(["RECIPIENT_ADD", "RECIPIENT_REMOVE", "THREAD_CREATED", "THREAD_STARTER_MESSAGE"]);
const STANDALONE_EVENTS = new Set(["RENAMED"]);

function duration(from: string, to: string | null) {
  const minutes = Math.max(
    0,
    Math.round(((to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime()) / 60000),
  );
  if (minutes < 60) return `${minutes} Min.`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} Std. ${minutes % 60} Min.`;
  return `${Math.floor(minutes / 60 / 24)} Tage ${Math.floor(minutes / 60) % 24} Std.`;
}

function SectionTitle({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <p className="text-xs font-bold tracking-wide text-[#949ba4] uppercase">{children}</p>
      {action}
    </div>
  );
}

function Box({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded border",
        checked ? "border-[#5865f2] bg-[#5865f2] text-white" : "border-[#6d6f78]",
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-[#b5bac1] hover:bg-[#35373c] hover:text-[#f2f3f5]"
    >
      <Box checked={checked} />
      <span className="flex-1">{label}</span>
      <span className="text-xs text-[#6d6f78] tabular-nums">{count}</span>
    </button>
  );
}

export function TranscriptView({ transcript }: { transcript: Transcript }) {
  const { ticket, users, guild } = transcript;
  const canSeeInternal = transcript.viewer !== "CREATOR";
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [show, setShow] = useState<Set<Show>>(() => new Set<Show>(["messages", "bot", "internal", "deleted"]));
  const [highlight, setHighlight] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleShow = (key: Show) =>
    setShow((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const messages = useMemo(
    () => transcript.messages.filter((message) => !(message.system && HIDDEN_SYSTEM.has(message.type))),
    [transcript.messages],
  );
  const byId = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);
  const name = useCallback((id: string | null) => (id ? (users[id]?.name ?? `Nutzer ${id}`) : "Unbekannt"), [users]);
  const userNames = useMemo(
    () => Object.fromEntries(Object.values(users).map((user) => [user.id, user.name ?? user.id])),
    [users],
  );
  const roles = useMemo<Role[]>(
    () =>
      Object.entries(transcript.roles ?? {}).map(([id, role]) => ({
        id,
        name: role.name,
        color: role.color ?? 0,
        position: 0,
        managed: false,
      })),
    [transcript.roles],
  );
  const channels = useMemo<Channel[]>(
    () =>
      Object.entries(transcript.channels ?? {}).map(([id, channelName]) => ({
        id,
        name: channelName,
        type: "text",
        parentId: null,
        position: 0,
      })),
    [transcript.channels],
  );

  const counts = useMemo(
    () => ({
      messages: messages.filter((message) => !message.author.bot && !message.internal).length,
      bot: messages.filter((message) => message.author.bot && !message.internal).length,
      internal: messages.filter((message) => message.internal).length,
      deleted: messages.filter((message) => message.deletedAt).length,
      files: messages.filter((message) => message.attachments.length > 0).length,
    }),
    [messages],
  );

  const participants = useMemo(() => {
    const result = new Map<
      string,
      { id: string; name: string; avatar: string | null; color: number | null; count: number; bot: boolean }
    >();
    for (const message of messages) {
      const entry = result.get(message.author.id) ?? {
        id: message.author.id,
        name: message.author.displayName ?? message.author.name,
        avatar: message.author.avatarUrl,
        color: message.author.color ?? null,
        count: 0,
        bot: message.author.bot,
      };
      entry.count++;
      result.set(message.author.id, entry);
    }
    return [...result.values()].sort((a, b) => Number(a.bot) - Number(b.bot) || b.count - a.count);
  }, [messages]);

  const query = search.trim().toLowerCase();
  const narrowed = selected.length > 0 || show.has("files") || query.length > 0;

  const visible = useMemo(() => {
    const filtered = messages.filter((message) => {
      const kind: Show = message.internal ? "internal" : message.author.bot ? "bot" : "messages";
      if (!show.has(kind)) return false;
      if (!show.has("deleted") && message.deletedAt) return false;
      if (show.has("files") && message.attachments.length === 0) return false;
      if (selected.length > 0 && !selected.includes(message.author.id)) return false;
      if (query) {
        const haystack = [
          message.content,
          ...message.edits.map((edit) => edit.content),
          ...message.embeds.flatMap((embed) => [
            embed.title,
            embed.description,
            ...(embed.fields ?? []).flatMap((field) => [field.name, field.value]),
          ]),
          ...message.attachments.map((attachment) => attachment.name),
        ]
          .filter(Boolean)
          .join("\n")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
    const items: Item[] = filtered.map((message) => ({
      kind: "message",
      at: new Date(message.createdAt).getTime(),
      message,
    }));
    if (show.has("bot") && selected.length === 0 && !show.has("files") && !query) {
      for (const event of transcript.events) {
        if (STANDALONE_EVENTS.has(event.type)) {
          items.push({ kind: "event", at: new Date(event.createdAt).getTime(), event });
        }
      }
    }
    return items.sort((a, b) => a.at - b.at || (a.kind === "event" ? -1 : 1));
  }, [messages, transcript.events, show, selected, query]);

  const rows = useMemo(() => {
    const dayOf = (at: number) =>
      new Date(at).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
    return visible.map((item, index) => {
      const day = dayOf(item.at);
      const prior = index > 0 ? visible[index - 1] : undefined;
      const showDay = !prior || dayOf(prior.at) !== day;
      const before = prior?.kind === "message" ? prior.message : null;
      const grouped =
        item.kind === "message" &&
        !showDay &&
        before !== null &&
        before.author.id === item.message.author.id &&
        before.internal === item.message.internal &&
        !item.message.reference &&
        !item.message.system &&
        item.at - new Date(before.createdAt).getTime() < GROUP_WINDOW_MS;
      return { item, day, showDay, grouped };
    });
  }, [visible]);

  const messageCount = visible.filter((item) => item.kind === "message").length;

  const jump = useCallback((id: string) => {
    const element = document.getElementById(`m-${id}`);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlight(id);
    window.setTimeout(() => setHighlight((current) => (current === id ? null : current)), 2000);
  }, []);

  const ctx: MessageContext = {
    uuid: ticket.uuid,
    channels,
    roles,
    users: userNames,
    byId,
    onJump: jump,
  };

  const eventText = (event: TranscriptEvent) => (
    <>
      <strong className="font-semibold text-[#f2f3f5]">{name(event.actorId)}</strong> hat den Kanal in #{event.detail}{" "}
      umbenannt.
    </>
  );

  const meta: [string, string][] = [
    ["Erstellt von", name(ticket.creatorId)],
    ...(ticket.openedBy !== ticket.creatorId
      ? ([["Geöffnet durch", name(ticket.openedBy)]] as [string, string][])
      : []),
    ["Bearbeitet von", ticket.claimedBy ? name(ticket.claimedBy) : "–"],
    ["Geöffnet", formatTime(ticket.createdAt)],
    ["Geschlossen", ticket.closedAt ? formatTime(ticket.closedAt) : "noch offen"],
    ["Geschlossen von", ticket.closedBy ? name(ticket.closedBy) : "–"],
    ["Dauer", duration(ticket.createdAt, ticket.closedAt)],
    ["Erste Antwort", ticket.firstResponseAt ? `nach ${duration(ticket.createdAt, ticket.firstResponseAt)}` : "–"],
  ];
  const decision =
    ticket.applicationState === "ACCEPTED"
      ? " · ✅ angenommen"
      : ticket.applicationState === "DENIED"
        ? " · ❌ abgelehnt"
        : "";

  return (
    <div className="min-h-dvh bg-[#313338] font-[system-ui] text-[#dbdee1]">
      <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-[#1f2023] bg-[#313338]/95 px-4 shadow-sm backdrop-blur">
        {guild.iconUrl ? (
          <img src={guild.iconUrl} alt="" className="size-6 rounded-full" />
        ) : (
          <Hash className="size-5 text-[#80848e]" />
        )}
        <span className="truncate text-sm text-[#949ba4]">{guild.name}</span>
        <span className="text-[#4e5058]">/</span>
        <Hash className="size-5 shrink-0 text-[#80848e]" />
        <h1 className="truncate font-semibold text-[#f2f3f5]">{ticket.channelName}</h1>
        <span
          className={cn(
            "ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
            ticket.status === "OPEN" ? "bg-[#23a55a33] text-[#23a55a]" : "bg-[#4e5058] text-[#dbdee1]",
          )}
        >
          {ticket.status === "OPEN" ? "OFFEN" : "GESCHLOSSEN"}
        </span>
        <button
          type="button"
          onClick={() => setFiltersOpen((value) => !value)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-[#b5bac1] hover:bg-[#35373c] lg:hidden"
        >
          <Filter className="size-4" />
          Filter
        </button>
      </header>

      <div className="lg:flex">
        <aside
          className={cn(
            "border-b border-[#1f2023] bg-[#2b2d31] lg:sticky lg:top-12 lg:block lg:h-[calc(100dvh-3rem)] lg:w-[300px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0",
            !filtersOpen && "hidden",
          )}
        >
          <div className="space-y-6 p-4">
            <div>
              <SectionTitle>Ticket</SectionTitle>
              <h2 className="text-lg font-bold text-[#f2f3f5]">
                #{ticket.number} · {ticket.category}
              </h2>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-[#949ba4]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nachrichten durchsuchen"
                className="h-9 w-full rounded-md bg-[#1e1f22] pr-8 pl-8 text-sm text-[#dbdee1] placeholder:text-[#6d6f78] focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute top-2 right-2 rounded p-0.5 text-[#949ba4] hover:text-[#f2f3f5]"
                  aria-label="Suche leeren"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div>
              <SectionTitle>Anzeigen</SectionTitle>
              <CheckRow
                checked={show.has("messages")}
                onChange={() => toggleShow("messages")}
                label="Nachrichten"
                count={counts.messages}
              />
              <CheckRow
                checked={show.has("bot")}
                onChange={() => toggleShow("bot")}
                label="Bot-Meldungen"
                count={counts.bot}
              />
              {canSeeInternal && (
                <CheckRow
                  checked={show.has("internal")}
                  onChange={() => toggleShow("internal")}
                  label="Team-Notizen"
                  count={counts.internal}
                />
              )}
              <CheckRow
                checked={show.has("deleted")}
                onChange={() => toggleShow("deleted")}
                label="Gelöschte Nachrichten"
                count={counts.deleted}
              />
              <CheckRow
                checked={show.has("files")}
                onChange={() => toggleShow("files")}
                label="Nur mit Dateien"
                count={counts.files}
              />
            </div>

            <div>
              <SectionTitle
                action={
                  selected.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setSelected([])}
                      className="text-xs font-semibold text-[#00a8fc] hover:underline"
                    >
                      Alle zeigen
                    </button>
                  ) : undefined
                }
              >
                {`Personen (${participants.length})`}
              </SectionTitle>
              <ul className="space-y-0.5">
                {participants.map((person) => {
                  const active = selected.includes(person.id);
                  return (
                    <li key={person.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={active}
                        onClick={() =>
                          setSelected((current) =>
                            active ? current.filter((id) => id !== person.id) : [...current, person.id],
                          )
                        }
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-[#35373c]",
                          active && "bg-[#404249]",
                        )}
                      >
                        <Box checked={active} />
                        {person.avatar ? (
                          <img src={person.avatar} alt="" className="size-6 rounded-full" />
                        ) : (
                          <span className="size-6 rounded-full bg-[#5865f2]" />
                        )}
                        <span className="min-w-0 flex-1 truncate font-medium" style={{ color: colorOf(person.color) }}>
                          {person.name}
                        </span>
                        <span className="text-xs text-[#6d6f78] tabular-nums">{person.count}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-[#3f4147] pt-5">
              <SectionTitle>Details</SectionTitle>
              <dl className=" space-y-1.5 text-sm">
                {meta.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-[#949ba4]">{label}</dt>
                    <dd className="truncate text-right text-[#dbdee1]">{value}</dd>
                  </div>
                ))}
              </dl>
              {ticket.closeReason && (
                <p className="mt-3 rounded-md bg-[#1e1f22] p-2.5 text-sm">
                  <span className="block text-xs font-semibold text-[#949ba4]">Grund</span>
                  {ticket.closeReason}
                </p>
              )}
              {ticket.rating && (
                <div className="mt-3 rounded-md bg-[#1e1f22] p-2.5 text-sm">
                  <span className="block text-xs font-semibold text-[#949ba4]">
                    Bewertung{ticket.rating.supporterId ? ` für ${name(ticket.rating.supporterId)}` : ""}
                  </span>
                  <span className="mt-1 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "size-4",
                          star <= ticket.rating!.stars ? "fill-[#f0b232] text-[#f0b232]" : "text-[#4e5058]",
                        )}
                      />
                    ))}
                  </span>
                  {ticket.rating.comment && <p className="mt-1.5 text-[#dbdee1]">„{ticket.rating.comment}“</p>}
                </div>
              )}
            </div>

            {ticket.answers.length > 0 && (
              <div>
                <SectionTitle>{`Formular${decision}`}</SectionTitle>
                <dl className="space-y-2 text-sm">
                  {ticket.answers.map((answer, index) => (
                    <div key={index} className="rounded-md bg-[#1e1f22] p-2.5">
                      <dt className="text-xs font-semibold text-[#949ba4]">{answer.question}</dt>
                      <dd className="mt-0.5 break-words">
                        {answer.answer ? (
                          <DiscordMarkdown text={answer.answer} channels={channels} roles={roles} users={userNames} />
                        ) : (
                          "–"
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <p className="text-xs text-[#6d6f78]">
              Ticket-ID {ticket.uuid}
              {transcript.hiddenInternal > 0 &&
                !canSeeInternal &&
                ` · ${transcript.hiddenInternal} interne Notizen ausgeblendet`}
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-16">
          <div className="px-4 pt-8 pb-2">
            <span className="flex size-16 items-center justify-center rounded-full bg-[#41434a]">
              <Hash className="size-9 text-[#f2f3f5]" />
            </span>
            <h2 className="mt-3 text-[2rem] leading-tight font-bold text-[#f2f3f5]">#{ticket.channelName}</h2>
            <p className="text-[#b5bac1]">
              Ticket #{ticket.number} in {ticket.category}, geöffnet von {name(ticket.creatorId)} am{" "}
              {formatTime(ticket.createdAt)}.
            </p>
            {narrowed && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#5865f21f] px-3 py-1.5 text-sm text-[#c9cdfb]">
                <Filter className="size-4" />
                {messageCount} {messageCount === 1 ? "Nachricht passt" : "Nachrichten passen"} zum Filter
              </p>
            )}
          </div>

          {visible.length === 0 && <p className="px-4 py-16 text-center text-[#949ba4]">Keine Nachrichten gefunden.</p>}

          {rows.map(({ item, day, showDay, grouped }) =>
            item.kind === "event" ? (
              <Fragment key={`e-${item.event.createdAt}-${item.event.type}-${item.event.actorId}`}>
                {showDay && <Separator>{day}</Separator>}
                <div className="flex items-center gap-3 py-1.5 pr-4 pl-[30px] text-sm text-[#949ba4]">
                  <Clock3 className="size-4 shrink-0 text-[#80848e]" />
                  <span>{eventText(item.event)}</span>
                  <span className="shrink-0 text-xs">{formatTime(item.event.createdAt)}</span>
                </div>
              </Fragment>
            ) : (
              <Fragment key={item.message.id}>
                {showDay && <Separator>{day}</Separator>}
                <TranscriptMessageView
                  message={item.message}
                  ctx={ctx}
                  grouped={grouped}
                  highlighted={highlight === item.message.id}
                />
              </Fragment>
            ),
          )}
        </main>
      </div>
    </div>
  );
}
