"use client";

import { ChevronDown } from "lucide-react";
import { DiscordMarkdown } from "@/components/discord/markdown";
import type { ButtonStyle, Channel, Embed, MessagePayload, Role } from "@/lib/bot-api/types";
import { customEmojiUrl, parseCustomEmoji } from "@/lib/discord/emoji";
import { colorToHex } from "@/lib/embeds/payload";
import { cn } from "@/lib/utils";

export type PreviewComponents =
  | { type: "BUTTONS"; buttons: { label: string | null; emoji: string | null; style: ButtonStyle }[] }
  | { type: "SELECT"; placeholder: string }
  | { type: "REACTIONS"; emojis: string[] };

const BUTTON_COLORS: Record<ButtonStyle, string> = {
  PRIMARY: "bg-[#5865f2]",
  SECONDARY: "bg-[#4e5058]",
  SUCCESS: "bg-[#248046]",
  DANGER: "bg-[#da373c]",
};

function EmojiText({ emoji }: { emoji: string }) {
  const custom = parseCustomEmoji(emoji);
  if (custom) {
    return <img src={customEmojiUrl(custom, 44)} alt={`:${custom.name}:`} className="size-[18px]" />;
  }
  return <span>{emoji}</span>;
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function EmbedPreview({ embed, channels, roles }: { embed: Embed; channels: Channel[]; roles: Role[] }) {
  const fields = embed.fields ?? [];
  const hasThumbnail = Boolean(embed.thumbnail?.url);
  return (
    <div
      className="mt-1 grid max-w-[520px] rounded-[4px] border-l-4 bg-[#2b2d31] py-3 pr-4 pl-3 text-[0.875rem] leading-[1.375rem]"
      style={{ borderLeftColor: colorToHex(embed.color ?? 0x1e1f22) }}
    >
      <div className={cn("grid gap-2", hasThumbnail && "grid-cols-[1fr_80px]")}>
        <div className="min-w-0 space-y-1">
          {embed.author?.name && (
            <div className="flex items-center gap-2 text-[0.875rem] font-semibold text-[#f2f3f5]">
              {embed.author.icon_url && <img src={embed.author.icon_url} alt="" className="size-6 rounded-full" />}
              {embed.author.name}
            </div>
          )}
          {embed.title && (
            <div className={cn("text-base font-semibold", embed.url ? "text-[#00a8fc]" : "text-[#f2f3f5]")}>
              <DiscordMarkdown text={embed.title} channels={channels} roles={roles} />
            </div>
          )}
          {embed.description && (
            <div className="text-[#dbdee1]">
              <DiscordMarkdown text={embed.description} channels={channels} roles={roles} />
            </div>
          )}
          {fields.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-2">
              {fields.map((field, index) => (
                <div key={index} className={field.inline ? "col-span-1" : "col-span-3"}>
                  <div className="font-semibold text-[#f2f3f5]">
                    <DiscordMarkdown text={field.name || "​"} channels={channels} roles={roles} />
                  </div>
                  <div className="text-[#dbdee1]">
                    <DiscordMarkdown text={field.value || "​"} channels={channels} roles={roles} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {hasThumbnail && <img src={embed.thumbnail!.url} alt="" className="size-20 rounded object-cover" />}
      </div>
      {embed.image?.url && (
        <img src={embed.image.url} alt="" className="mt-4 max-h-[300px] max-w-full rounded object-contain" />
      )}
      {(embed.footer?.text || embed.timestamp) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-[#b5bac1]">
          {embed.footer?.icon_url && <img src={embed.footer.icon_url} alt="" className="size-5 rounded-full" />}
          <span>
            {embed.footer?.text}
            {embed.footer?.text && embed.timestamp && " • "}
            {embed.timestamp && formatTimestamp(embed.timestamp)}
          </span>
        </div>
      )}
    </div>
  );
}

export function DiscordPreview({
  payload,
  botName,
  botAvatarUrl,
  channels,
  roles,
  components,
}: {
  payload: MessagePayload;
  botName: string;
  botAvatarUrl: string | null;
  channels: Channel[];
  roles: Role[];
  components?: PreviewComponents;
}) {
  const time = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const isEmpty = !payload.content?.trim() && (payload.embeds ?? []).length === 0;
  return (
    <div className="rounded-2xl bg-[#313338] p-4 font-[system-ui] text-[#dbdee1]">
      <div className="flex gap-4">
        {botAvatarUrl ? (
          <img src={botAvatarUrl} alt="" className="size-10 shrink-0 rounded-full" />
        ) : (
          <span className="size-10 shrink-0 rounded-full bg-[#5865f2]" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-[#f2f3f5]">{botName}</span>
            <span className="rounded bg-[#5865f2] px-1 text-[10px] leading-4 font-semibold text-white">APP</span>
            <span className="text-xs text-[#949ba4]">Heute um {time}</span>
          </div>
          {isEmpty && <p className="text-sm text-[#949ba4] italic">Die Nachricht ist noch leer.</p>}
          {payload.content?.trim() && (
            <div className="text-[0.95rem] leading-[1.375rem]">
              <DiscordMarkdown text={payload.content} channels={channels} roles={roles} />
            </div>
          )}
          {(payload.embeds ?? []).map((embed, index) => (
            <EmbedPreview key={index} embed={embed} channels={channels} roles={roles} />
          ))}
          {components?.type === "BUTTONS" && components.buttons.length > 0 && (
            <div className="mt-2 flex max-w-[520px] flex-wrap gap-2">
              {components.buttons.map((button, index) => (
                <span
                  key={index}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-[3px] px-4 text-sm font-medium text-white",
                    BUTTON_COLORS[button.style],
                  )}
                >
                  {button.emoji && <EmojiText emoji={button.emoji} />}
                  {button.label}
                </span>
              ))}
            </div>
          )}
          {components?.type === "SELECT" && (
            <div className="mt-2 flex h-10 max-w-[400px] items-center justify-between rounded-[4px] border border-[#1e1f22] bg-[#1e1f22] px-3 text-sm text-[#949ba4]">
              {components.placeholder}
              <ChevronDown className="size-4" />
            </div>
          )}
          {components?.type === "REACTIONS" && components.emojis.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {components.emojis.map((emoji, index) => (
                <span
                  key={index}
                  className="inline-flex h-6 items-center gap-1.5 rounded-lg border border-[#5865f2] bg-[#5865f226] px-1.5 text-sm"
                >
                  <EmojiText emoji={emoji} />
                  <span className="text-xs font-semibold text-[#dee0fc]">1</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
