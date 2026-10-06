"use client";

import { SelectMenu, type SelectMenuOption } from "@/components/ui/select-menu";
import type { Channel } from "@/lib/bot-api/types";

const SENDABLE = new Set(["text", "news"]);

export function ChannelSelect({
  channels,
  value,
  onChange,
  placeholder = "Kanal auswählen",
}: {
  channels: Channel[];
  value: string;
  onChange: (channelId: string) => void;
  placeholder?: string;
}) {
  const sorted = [...channels].sort((a, b) => a.position - b.position);
  const categories = sorted.filter((channel) => channel.type === "category");
  const sendable = sorted.filter((channel) => SENDABLE.has(channel.type));
  const toOption = (channel: Channel, group?: string): SelectMenuOption => ({
    value: channel.id,
    label: channel.name,
    prefix: "#",
    group,
  });
  const options = [
    ...sendable.filter((channel) => !channel.parentId).map((channel) => toOption(channel)),
    ...categories.flatMap((category) =>
      sendable.filter((channel) => channel.parentId === category.id).map((channel) => toOption(channel, category.name)),
    ),
  ];

  return (
    <SelectMenu
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder="Kanäle durchsuchen …"
      ariaLabel="Kanal"
    />
  );
}
