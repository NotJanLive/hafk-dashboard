import type { ReactNode } from "react";
import type { Channel, Role } from "@/lib/bot-api/types";
import { roleColor } from "@/lib/discord/cdn";
import { formatDiscordTimestamp } from "@/lib/discord/timestamp";

type Context = { channels: Channel[]; roles: Role[] };

const INLINE =
  /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(~~[^~\n]+~~)|(\*[^*\n]+\*)|(_[^_\n]+_)|(\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))|(<@&\d{17,20}>|<#\d{17,20}>|<@!?\d{17,20}>)|(<a?:\w+:\d{17,20}>)|(https?:\/\/[^\s<]+)|(\|\|[^|\n]+\|\|)|(<t:-?\d{1,13}(?::[tTdDfFR])?>)/g;

function inline(text: string, ctx: Context, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;
    if (match[1]) {
      nodes.push(
        <code key={key} className="rounded bg-[#1e1f22] px-1 py-0.5 font-mono text-[0.85em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (match[2]) {
      nodes.push(<strong key={key}>{inline(token.slice(2, -2), ctx, key)}</strong>);
    } else if (match[3]) {
      nodes.push(<u key={key}>{inline(token.slice(2, -2), ctx, key)}</u>);
    } else if (match[4]) {
      nodes.push(<s key={key}>{inline(token.slice(2, -2), ctx, key)}</s>);
    } else if (match[5] || match[6]) {
      nodes.push(<em key={key}>{inline(token.slice(1, -1), ctx, key)}</em>);
    } else if (match[7]) {
      const [, label, url] = /^\[([^\]]+)\]\((.+)\)$/.exec(token)!;
      nodes.push(
        <a key={key} href={url} target="_blank" rel="noreferrer" className="text-[#00a8fc] hover:underline">
          {label}
        </a>,
      );
    } else if (match[8]) {
      nodes.push(<Mention key={key} token={token} ctx={ctx} />);
    } else if (match[9]) {
      const [, animated, name, id] = /^<(a?):(\w+):(\d+)>$/.exec(token)!;
      nodes.push(
        <img
          key={key}
          src={`https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "webp"}?size=44`}
          alt={`:${name}:`}
          className="inline size-[1.375em] align-[-0.3em]"
        />,
      );
    } else if (match[12]) {
      const [, seconds, style] = /^<t:(-?\d+)(?::(\w))?>$/.exec(token)!;
      nodes.push(
        <span key={key} className="rounded bg-[#ffffff14] px-1">
          {formatDiscordTimestamp(Number(seconds), style)}
        </span>,
      );
    } else if (match[11]) {
      nodes.push(
        <span key={key} className="rounded bg-[#1e1f22] px-0.5 text-transparent transition-colors hover:text-inherit">
          {inline(token.slice(2, -2), ctx, key)}
        </span>,
      );
    } else {
      nodes.push(
        <a key={key} href={token} target="_blank" rel="noreferrer" className="text-[#00a8fc] hover:underline">
          {token}
        </a>,
      );
    }
    last = start + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function Mention({ token, ctx }: { token: string; ctx: Context }) {
  const id = token.replace(/\D/g, "");
  if (token.startsWith("<@&")) {
    const role = ctx.roles.find((candidate) => candidate.id === id);
    const color = roleColor(role?.color ?? 0);
    return (
      <span
        className="rounded px-0.5 font-medium"
        style={{ color: color ?? "#c9cdfb", background: color ? `${color}26` : "#5865f24d" }}
      >
        @{role?.name ?? "unbekannte Rolle"}
      </span>
    );
  }
  if (token.startsWith("<#")) {
    const channel = ctx.channels.find((candidate) => candidate.id === id);
    return (
      <span className="rounded bg-[#5865f24d] px-0.5 font-medium text-[#c9cdfb]">#{channel?.name ?? "unbekannt"}</span>
    );
  }
  return <span className="rounded bg-[#5865f24d] px-0.5 font-medium text-[#c9cdfb]">@Nutzer</span>;
}

export function DiscordMarkdown({ text, channels, roles }: { text: string; channels: Channel[]; roles: Role[] }) {
  const ctx = { channels, roles };
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, index) => {
        const key = `l${index}`;
        const heading = /^(#{1,3}) (.*)$/.exec(line);
        if (heading) {
          const size =
            heading[1]!.length === 1 ? "text-[1.5em]" : heading[1]!.length === 2 ? "text-[1.25em]" : "text-[1.1em]";
          return (
            <div key={key} className={`${size} my-1 font-bold`}>
              {inline(heading[2]!, ctx, key)}
            </div>
          );
        }
        if (line.startsWith("-# ")) {
          return (
            <div key={key} className="text-[0.8em] text-[#949ba4]">
              {inline(line.slice(3), ctx, key)}
            </div>
          );
        }
        if (line.startsWith("> ")) {
          return (
            <div key={key} className="border-l-4 border-[#4e5058] pl-3">
              {inline(line.slice(2), ctx, key)}
            </div>
          );
        }
        const list = /^\s*[-*] (.*)$/.exec(line);
        if (list) {
          return (
            <div key={key} className="flex gap-2 pl-2">
              <span>•</span>
              <span>{inline(list[1]!, ctx, key)}</span>
            </div>
          );
        }
        return (
          <div key={key} className="min-h-[1.375em]">
            {inline(line, ctx, key)}
          </div>
        );
      })}
    </>
  );
}
