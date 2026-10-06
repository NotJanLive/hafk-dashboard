import { z } from "zod";
import type { Embed, MessagePayload } from "@/lib/bot-api/types";

export const LIMITS = {
  content: 2000,
  embeds: 10,
  title: 256,
  description: 4096,
  fields: 25,
  fieldName: 256,
  fieldValue: 1024,
  footer: 2048,
  author: 256,
  total: 6000,
} as const;

export const DEFAULT_COLOR = 0x5b6cff;

export function emptyEmbed(): Embed {
  return { title: "", description: "", color: DEFAULT_COLOR, fields: [] };
}

export function emptyPayload(): MessagePayload {
  return { content: "", embeds: [emptyEmbed()] };
}

export function colorToHex(color: number | undefined) {
  return `#${(color ?? DEFAULT_COLOR).toString(16).padStart(6, "0")}`;
}

export function hexToColor(hex: string): number | undefined {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  return match ? Number.parseInt(match[1]!, 16) : undefined;
}

const clean = (value: string | undefined) => (value && value.trim() !== "" ? value : undefined);

function cleanObject<T extends object>(value: T): T | undefined {
  const entries = Object.entries(value).filter(([, entry]) => entry !== undefined);
  return entries.length === 0 ? undefined : (Object.fromEntries(entries) as T);
}

export function cleanPayload(payload: MessagePayload): MessagePayload {
  const embeds = (payload.embeds ?? []).map((embed) =>
    cleanObject<Embed>({
      title: clean(embed.title),
      description: clean(embed.description),
      url: clean(embed.url),
      color: embed.color,
      timestamp: clean(embed.timestamp),
      author: embed.author
        ? cleanObject({
            name: clean(embed.author.name),
            url: clean(embed.author.url),
            icon_url: clean(embed.author.icon_url),
          })
        : undefined,
      footer: embed.footer
        ? cleanObject({ text: clean(embed.footer.text), icon_url: clean(embed.footer.icon_url) })
        : undefined,
      thumbnail: clean(embed.thumbnail?.url) ? { url: embed.thumbnail!.url } : undefined,
      image: clean(embed.image?.url) ? { url: embed.image!.url } : undefined,
      fields: embed.fields && embed.fields.length > 0 ? embed.fields : undefined,
    }),
  );
  return (
    cleanObject<MessagePayload>({
      content: clean(payload.content),
      embeds: embeds.filter((embed): embed is Embed => embed !== undefined),
    }) ?? { embeds: [] }
  );
}

export function exportPayload(payload: MessagePayload) {
  return JSON.stringify(cleanPayload(payload), null, 2);
}

const media = z.looseObject({ url: z.string().optional() });
const embedSchema = z.looseObject({
  title: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  color: z.number().int().min(0).max(0xffffff).nullish(),
  timestamp: z.string().optional(),
  author: z
    .looseObject({ name: z.string().optional(), url: z.string().optional(), icon_url: z.string().optional() })
    .optional(),
  footer: z.looseObject({ text: z.string().optional(), icon_url: z.string().optional() }).optional(),
  thumbnail: media.optional(),
  image: media.optional(),
  fields: z.array(z.looseObject({ name: z.string(), value: z.string(), inline: z.boolean().optional() })).optional(),
});
const messageSchema = z.looseObject({ content: z.string().nullish(), embeds: z.array(embedSchema).nullish() });

export type ImportResult = { ok: true; payload: MessagePayload } | { ok: false; error: string };

export function parseImport(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "Das ist kein gültiges JSON." };
  }
  if (raw && typeof raw === "object" && "messages" in raw && Array.isArray((raw as { messages: unknown[] }).messages)) {
    raw = ((raw as { messages: { data?: unknown }[] }).messages[0] ?? {}).data;
  }
  if (raw && typeof raw === "object" && !("embeds" in raw) && !("content" in raw)) {
    raw = { embeds: [raw] };
  }
  const result = messageSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { ok: false, error: `Ungültiges Format bei „${issue?.path.join(".") || "Nachricht"}“: ${issue?.message}` };
  }
  const payload = cleanPayload({
    content: result.data.content ?? undefined,
    embeds: (result.data.embeds ?? []).map((embed) => ({
      title: embed.title,
      description: embed.description,
      url: embed.url,
      color: embed.color ?? undefined,
      timestamp: embed.timestamp,
      author: embed.author && { name: embed.author.name, url: embed.author.url, icon_url: embed.author.icon_url },
      footer: embed.footer && { text: embed.footer.text, icon_url: embed.footer.icon_url },
      thumbnail: embed.thumbnail && { url: embed.thumbnail.url },
      image: embed.image && { url: embed.image.url },
      fields: embed.fields?.map((field) => ({ name: field.name, value: field.value, inline: field.inline ?? false })),
    })),
  });
  if (!payload.content && (payload.embeds ?? []).length === 0) {
    return { ok: false, error: "Das JSON enthält weder Text noch Embeds." };
  }
  if ((payload.embeds ?? []).length > LIMITS.embeds) {
    return { ok: false, error: `Eine Nachricht kann höchstens ${LIMITS.embeds} Embeds enthalten.` };
  }
  return { ok: true, payload };
}

export function totalLength(payload: MessagePayload) {
  return (payload.embeds ?? []).reduce(
    (sum, embed) =>
      sum +
      (embed.title?.length ?? 0) +
      (embed.description?.length ?? 0) +
      (embed.author?.name?.length ?? 0) +
      (embed.footer?.text?.length ?? 0) +
      (embed.fields ?? []).reduce((fieldSum, field) => fieldSum + field.name.length + field.value.length, 0),
    0,
  );
}
