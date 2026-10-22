"use client";

import { CornerUpRight, Download, FileText, History, Lock, Pin, Trash2 } from "lucide-react";
import { Fragment, type ReactNode, useState } from "react";
import { DiscordMarkdown } from "@/components/discord/markdown";
import { EmbedPreview } from "@/components/embeds/discord-preview";
import type { Channel, Embed, Role, TranscriptMessage, TranscriptRawEmbed } from "@/lib/bot-api/types";
import { cn } from "@/lib/utils";

export type MessageContext = {
  uuid: string;
  channels: Channel[];
  roles: Role[];
  users: Record<string, string>;
  byId: Map<string, TranscriptMessage>;
  onJump: (id: string) => void;
};

const BUTTON_COLORS: Record<string, string> = {
  PRIMARY: "bg-[#5865f2]",
  SECONDARY: "bg-[#4e5058]",
  SUCCESS: "bg-[#248046]",
  DANGER: "bg-[#da373c]",
  LINK: "bg-[#4e5058]",
};

const SYSTEM_TEXT: Record<string, string> = {
  CHANNEL_PINNED_ADD: "hat eine Nachricht angeheftet.",
  THREAD_CREATED: "hat einen Thread erstellt.",
  CHANNEL_NAME_CHANGE: "hat den Kanal umbenannt.",
  RECIPIENT_ADD: "hat jemanden hinzugefügt.",
  RECIPIENT_REMOVE: "hat jemanden entfernt.",
  GUILD_MEMBER_JOIN: "ist dem Server beigetreten.",
};

export function assetUrl(uuid: string, asset: number | null | undefined) {
  return asset ? `/transcripts/${uuid}/assets/${asset}` : null;
}

export function avatarOf(uuid: string, message: TranscriptMessage) {
  return assetUrl(uuid, message.author.avatar) ?? message.author.avatarUrl ?? null;
}

export function colorOf(value: number | null | undefined) {
  return value ? `#${value.toString(16).padStart(6, "0")}` : undefined;
}

export function formatTime(iso: string, withDate = true) {
  return new Date(iso).toLocaleString(
    "de-DE",
    withDate
      ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
      : { hour: "2-digit", minute: "2-digit" },
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function toEmbed(raw: TranscriptRawEmbed): Embed {
  return {
    title: raw.title,
    description: raw.description,
    url: raw.url,
    color: raw.color,
    timestamp: raw.timestamp,
    author: raw.author
      ? { name: raw.author.name, url: raw.author.url, icon_url: raw.author.proxy_icon_url ?? raw.author.icon_url }
      : undefined,
    footer: raw.footer
      ? { text: raw.footer.text, icon_url: raw.footer.proxy_icon_url ?? raw.footer.icon_url }
      : undefined,
    thumbnail: raw.thumbnail ? { url: raw.thumbnail.proxy_url ?? raw.thumbnail.url } : undefined,
    image: raw.image ? { url: raw.image.proxy_url ?? raw.image.url } : undefined,
    fields: raw.fields,
  };
}

function Content({ message, ctx, text }: { message: TranscriptMessage; ctx: MessageContext; text: string }) {
  const roles: Role[] = [
    ...ctx.roles,
    ...Object.entries(message.mentions.roles)
      .filter(([id]) => !ctx.roles.some((role) => role.id === id))
      .map(([id, role]) => ({ id, name: role.name, color: role.color ?? 0, position: 0, managed: false })),
  ];
  const channels: Channel[] = [
    ...ctx.channels,
    ...Object.entries(message.mentions.channels)
      .filter(([id]) => !ctx.channels.some((channel) => channel.id === id))
      .map(([id, name]) => ({ id, name, type: "text", parentId: null, position: 0 })),
  ];
  const emojiSrc = (id: string) => assetUrl(ctx.uuid, message.emojis[id]);
  const parts: ReactNode[] = [];
  const fence = /```(?:(\w+)\n)?([\s\S]*?)```/g;
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(fence)) {
    const start = match.index ?? 0;
    if (start > last) {
      parts.push(
        <DiscordMarkdown
          key={index++}
          text={text.slice(last, start).replace(/\n$/, "")}
          channels={channels}
          roles={roles}
          users={{ ...ctx.users, ...message.mentions.users }}
          emojiSrc={emojiSrc}
        />,
      );
    }
    parts.push(
      <pre
        key={index++}
        className="my-1 overflow-x-auto rounded-md border border-[#1e1f22] bg-[#2b2d31] p-2.5 font-mono text-[0.85em] leading-relaxed"
      >
        {match[2]}
      </pre>,
    );
    last = start + match[0].length;
  }
  if (last < text.length) {
    parts.push(
      <DiscordMarkdown
        key={index++}
        text={text.slice(last)}
        channels={channels}
        roles={roles}
        users={{ ...ctx.users, ...message.mentions.users }}
        emojiSrc={emojiSrc}
      />,
    );
  }
  return <>{parts}</>;
}

function Attachment({ uuid, attachment }: { uuid: string; attachment: TranscriptMessage["attachments"][number] }) {
  const [revealed, setRevealed] = useState(!attachment.spoiler);
  const url = assetUrl(uuid, attachment.asset);
  const type = attachment.contentType ?? "";
  if (url && type.startsWith("image/")) {
    return (
      <div className="max-w-[min(100%,420px)]">
        <button
          type="button"
          onClick={() => (revealed ? window.open(url, "_blank", "noopener") : setRevealed(true))}
          className="relative block max-w-[min(100%,420px)] overflow-hidden rounded-lg"
          title={attachment.name}
        >
          <img
            src={url}
            alt={attachment.description ?? attachment.name}
            loading="lazy"
            className={cn("max-h-[350px] w-auto rounded-lg object-contain", !revealed && "blur-2xl")}
            style={attachment.width ? { aspectRatio: `${attachment.width} / ${attachment.height}` } : undefined}
          />
          {!revealed && (
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tracking-wide uppercase">
              Spoiler
            </span>
          )}
        </button>
        <a
          href={url}
          download={attachment.name}
          className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#949ba4] hover:text-[#00a8fc]"
        >
          <Download className="size-3.5" />
          {attachment.name} · {formatSize(attachment.size)}
        </a>
      </div>
    );
  }
  if (url && type.startsWith("video/")) {
    return <video src={url} controls preload="metadata" className="max-h-[350px] max-w-[min(100%,480px)] rounded-lg" />;
  }
  if (url && type.startsWith("audio/")) {
    return <audio src={url} controls preload="metadata" className="w-full max-w-md" />;
  }
  return (
    <div className="flex max-w-md items-center gap-3 rounded-lg border border-[#1e1f22] bg-[#2b2d31] p-3">
      <FileText className="size-8 shrink-0 text-[#b5bac1]" />
      <div className="min-w-0 flex-1">
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="block truncate text-[#00a8fc] hover:underline">
            {attachment.name}
          </a>
        ) : (
          <p className="truncate text-[#dbdee1]">{attachment.name}</p>
        )}
        <p className="text-xs text-[#949ba4]">
          {formatSize(attachment.size)}
          {!url && " · nicht gespeichert (zu groß oder nicht abrufbar)"}
        </p>
      </div>
      {url && (
        <a
          href={url}
          download={attachment.name}
          className="rounded p-1.5 text-[#b5bac1] hover:bg-[#ffffff14]"
          aria-label="Herunterladen"
        >
          <Download className="size-5" />
        </a>
      )}
    </div>
  );
}

function EditedMarker({ edits }: { edits: TranscriptMessage["edits"] }) {
  if (edits.length === 0) {
    return <span className="ml-1 text-[10px] text-[#949ba4] no-underline">(bearbeitet)</span>;
  }
  return (
    <span className="group/edit relative ml-1 inline-block no-underline">
      <span className="cursor-help text-[10px] text-[#949ba4] underline decoration-dotted underline-offset-2 hover:text-[#dbdee1]">
        (bearbeitet)
      </span>
      <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 hidden w-80 max-w-[80vw] rounded-lg border border-[#1e1f22] bg-[#111214] p-3 text-left shadow-xl group-hover/edit:block">
        <span className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-[#949ba4] uppercase">
          <History className="size-3.5" />
          Frühere Versionen
        </span>
        {edits.map((edit, index) => (
          <span
            key={index}
            className="mt-1.5 block border-l-2 border-[#4e5058] pl-2 text-sm leading-snug text-[#dbdee1]"
          >
            <span className="block text-[11px] text-[#949ba4]">
              Version {index + 1}
              {edit.editedAt && ` · bis ${formatTime(edit.editedAt)}`}
            </span>
            <span className="block break-words whitespace-pre-wrap">{edit.content || "(leer)"}</span>
          </span>
        ))}
      </span>
    </span>
  );
}

export function TranscriptMessageView({
  message,
  ctx,
  grouped,
  highlighted,
}: {
  message: TranscriptMessage;
  ctx: MessageContext;
  grouped: boolean;
  highlighted: boolean;
}) {
  const avatar = avatarOf(ctx.uuid, message);
  const color = colorOf(message.author.color);
  const name = message.author.displayName ?? message.author.name;
  const reply = message.reference ? ctx.byId.get(message.reference) : undefined;

  if (message.system) {
    return (
      <div id={`m-${message.id}`} className="flex items-center gap-3 py-1 pr-4 pl-[72px] text-sm text-[#949ba4]">
        <Pin className="size-4" />
        <span>
          <span className="font-medium text-[#f2f3f5]">{name}</span>{" "}
          {SYSTEM_TEXT[message.type] ?? message.content ?? message.type}
        </span>
        <span className="text-xs">{formatTime(message.createdAt)}</span>
      </div>
    );
  }

  return (
    <div
      id={`m-${message.id}`}
      className={cn(
        "group relative py-0.5 pr-4 pl-[72px] transition-colors hover:bg-[#2e3035]",
        !grouped && "mt-4",
        message.internal && "border-l-2 border-[#f0b232] bg-[#f0b2320d]",
        message.deletedAt && "bg-[#da373c14]",
        highlighted && "bg-[#5865f21f]",
      )}
    >
      {reply && !grouped && (
        <button
          type="button"
          onClick={() => ctx.onJump(reply.id)}
          className="mb-1 flex max-w-full items-center gap-1.5 text-left text-sm text-[#b5bac1] hover:text-[#f2f3f5]"
        >
          <CornerUpRight className="size-3.5 shrink-0 -scale-x-100" />
          <span className="shrink-0 font-medium" style={{ color: colorOf(reply.author.color) }}>
            @{reply.author.displayName ?? reply.author.name}
          </span>
          <span className="truncate text-[#949ba4]">{reply.content || "Anhang"}</span>
        </button>
      )}
      {!grouped && (
        <>
          {avatar ? (
            <img src={avatar} alt="" className="absolute top-1 left-4 size-10 rounded-full" />
          ) : (
            <span className="absolute top-1 left-4 size-10 rounded-full bg-[#5865f2]" />
          )}
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium text-[#f2f3f5]" style={{ color }}>
              {name}
            </span>
            {message.author.bot && (
              <span className="rounded bg-[#5865f2] px-1 text-[10px] leading-4 font-semibold text-white">APP</span>
            )}
            {message.internal && (
              <span className="inline-flex items-center gap-1 rounded bg-[#f0b232] px-1.5 text-[10px] leading-4 font-bold text-black">
                <Lock className="size-2.5" />
                TEAM-NOTIZ
              </span>
            )}
            <span className="text-xs text-[#949ba4]">{formatTime(message.createdAt)}</span>
          </div>
        </>
      )}
      {grouped && (
        <span className="absolute top-1.5 left-0 hidden w-[72px] text-center text-[11px] text-[#949ba4] group-hover:block">
          {formatTime(message.createdAt, false)}
        </span>
      )}

      {message.content && (
        <div
          className={cn(
            "text-[0.95rem] leading-[1.375rem] break-words text-[#dbdee1]",
            message.deletedAt && "line-through decoration-[#f23f43]/70 opacity-80",
          )}
        >
          <Content message={message} ctx={ctx} text={message.content} />
          {message.editedAt && <EditedMarker edits={message.edits} />}
        </div>
      )}

      {message.attachments.length > 0 && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          {message.attachments.map((attachment, index) => (
            <Attachment key={index} uuid={ctx.uuid} attachment={attachment} />
          ))}
        </div>
      )}

      {message.stickers.length > 0 && (
        <div className="mt-1 flex gap-2">
          {message.stickers.map((sticker, index) =>
            assetUrl(ctx.uuid, sticker.asset) ? (
              <img
                key={index}
                src={assetUrl(ctx.uuid, sticker.asset)!}
                alt={sticker.name}
                title={sticker.name}
                className="size-40"
              />
            ) : (
              <span key={index} className="rounded bg-[#2b2d31] px-2 py-1 text-sm text-[#949ba4]">
                Sticker: {sticker.name}
              </span>
            ),
          )}
        </div>
      )}

      {message.embeds.map((embed, index) => (
        <EmbedPreview key={index} embed={toEmbed(embed)} channels={ctx.channels} roles={ctx.roles} users={ctx.users} />
      ))}

      {message.components.length > 0 && (
        <div className="mt-2 flex max-w-[520px] flex-wrap gap-2">
          {message.components.map((button, index) => (
            <span
              key={index}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-[3px] px-4 text-sm font-medium text-white",
                BUTTON_COLORS[button.style] ?? BUTTON_COLORS.SECONDARY,
                button.disabled && "opacity-50",
              )}
            >
              {button.emoji && !button.emoji.startsWith("<") && <span>{button.emoji}</span>}
              {button.label}
            </span>
          ))}
        </div>
      )}

      {message.reactions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {message.reactions.map((reaction, index) => (
            <span
              key={index}
              className="inline-flex h-6 items-center gap-1.5 rounded-lg border border-[#3f4147] bg-[#2b2d31] px-1.5 text-sm"
              title={reaction.emojiName ? `:${reaction.emojiName}:` : reaction.emoji}
            >
              {reaction.emoji ? (
                <span>{reaction.emoji}</span>
              ) : assetUrl(ctx.uuid, reaction.asset) ? (
                <img src={assetUrl(ctx.uuid, reaction.asset)!} alt="" className="size-4" />
              ) : (
                <span>:{reaction.emojiName}:</span>
              )}
              <span className="text-xs font-semibold text-[#dbdee1]">{reaction.count}</span>
            </span>
          ))}
        </div>
      )}

      {message.deletedAt && (
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#f23f43]">
          <Trash2 className="size-3" />
          Gelöscht am {formatTime(message.deletedAt)}
        </p>
      )}
    </div>
  );
}

export function Separator({ children }: { children: ReactNode }) {
  return (
    <Fragment>
      <div className="mx-4 mt-6 mb-2 flex items-center gap-2 text-xs font-semibold text-[#949ba4]">
        <span className="h-px flex-1 bg-[#3f4147]" />
        {children}
        <span className="h-px flex-1 bg-[#3f4147]" />
      </div>
    </Fragment>
  );
}
