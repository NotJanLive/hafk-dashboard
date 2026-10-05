"use client";

import { ChevronDown, Hash } from "lucide-react";
import type { Channel } from "@/lib/bot-api/types";

/** Native select (accessible, keyboard friendly) for text channels, grouped by category. */
export function ChannelSelect({
  id,
  name,
  channels,
  defaultValue,
  emptyLabel,
}: {
  id?: string;
  name: string;
  channels: Channel[];
  defaultValue: string | null;
  emptyLabel: string;
}) {
  const categories = channels.filter((channel) => channel.type === "category").sort((a, b) => a.position - b.position);
  const textChannels = channels.filter((channel) => channel.type === "text").sort((a, b) => a.position - b.position);
  const uncategorized = textChannels.filter((channel) => !channel.parentId);

  return (
    <div className="relative">
      <Hash className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-10 w-full appearance-none rounded-lg border border-line-strong bg-surface-2 pr-9 pl-9 text-sm text-text transition-colors hover:border-faint focus:border-accent focus:outline-none"
      >
        <option value="">{emptyLabel}</option>
        {uncategorized.map((channel) => (
          <option key={channel.id} value={channel.id}>
            {channel.name}
          </option>
        ))}
        {categories.map((category) => {
          const children = textChannels.filter((channel) => channel.parentId === category.id);
          if (children.length === 0) return null;
          return (
            <optgroup key={category.id} label={category.name.toUpperCase()}>
              {children.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-faint" />
    </div>
  );
}
