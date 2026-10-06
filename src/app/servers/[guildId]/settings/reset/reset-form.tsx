"use client";

import { ArrowUpRight, RotateCcw, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import type { ResetPreview } from "@/lib/bot-api/types";
import { resetBot } from "./actions";

const MODULE_LABELS: Record<string, string> = { embeds: "Embed", "reaction-roles": "Reaction Roles" };

function Checkbox({
  checked,
  disabled,
  onChange,
  children,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-2 has-[:disabled]:cursor-default">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[var(--danger)]"
      />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

function toggle(set: Set<string>, id: string, checked: boolean) {
  const next = new Set(set);
  if (checked) next.add(id);
  else next.delete(id);
  return next;
}

export function ResetForm({
  guildId,
  guildName,
  preview,
}: {
  guildId: string;
  guildName: string;
  preview: ResetPreview;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [categories, setCategories] = useState(new Set(preview.categories.map((category) => category.id)));
  const [channels, setChannels] = useState(new Set(preview.channels.map((channel) => channel.id)));
  const [messages, setMessages] = useState(new Set(preview.messages.map((message) => message.id)));
  const [confirmation, setConfirmation] = useState("");
  const confirmed = confirmation.trim() === guildName;

  const submit = () =>
    startTransition(async () => {
      const response = await resetBot(guildId, {
        categories: [...categories],
        deleteChannels: [...channels],
        deleteMessages: [...messages],
        confirmation,
      });
      if (!response.ok) {
        toast.error(response.message);
        return;
      }
      const { result } = response;
      toast.success("Der Bot wurde zurückgesetzt.", {
        description: `${result.deletedMessages} Nachrichten und ${result.deletedChannels} Kanäle gelöscht.`,
      });
      result.problems.forEach((problem) => toast.warning(problem));
      router.push(`/servers/${guildId}/setup`);
    });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Gespeicherte Daten" description="Was aus der Datenbank des Bots gelöscht werden soll." />
        <CardBody className="space-y-1 pt-3">
          {preview.categories.map((category) => (
            <Checkbox
              key={category.id}
              checked={category.required || categories.has(category.id)}
              disabled={category.required}
              onChange={(checked) => setCategories(toggle(categories, category.id, checked))}
            >
              <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                {category.label}
                <span className="text-xs font-medium text-faint">
                  {category.required ? "immer" : `${category.count} Einträge`}
                </span>
              </span>
              <span className="mt-0.5 block text-[13px] text-muted">{category.description}</span>
            </Checkbox>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={`Vom Bot erstellte Kanäle (${preview.channels.length})`}
          description="Ausgewählte Kanäle werden in Discord gelöscht, die anderen bleiben bestehen."
        />
        <CardBody className="space-y-1 pt-3">
          {preview.channels.length === 0 && (
            <p className="px-3 text-sm text-faint">Der Bot hat bisher keine Kanäle erstellt.</p>
          )}
          {preview.channels.map((channel) => (
            <Checkbox
              key={channel.id}
              checked={channels.has(channel.id)}
              onChange={(checked) => setChannels(toggle(channels, channel.id, checked))}
            >
              <span className="text-sm font-semibold">#{channel.name}</span>
              <span className="ml-2 text-xs text-faint">{MODULE_LABELS[channel.module] ?? channel.module}</span>
            </Checkbox>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={`Vom Bot gesendete Nachrichten (${preview.messages.length})`}
          description="Ausgewählte Nachrichten werden in Discord gelöscht, die anderen bleiben stehen."
          actions={
            preview.messages.length > 0 ? (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMessages(new Set(preview.messages.map((message) => message.id)))}
                >
                  Alle
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMessages(new Set())}>
                  Keine
                </Button>
              </div>
            ) : undefined
          }
        />
        <CardBody className="space-y-1 pt-3">
          {preview.messages.length === 0 && (
            <p className="px-3 text-sm text-faint">Der Bot hat bisher keine Nachrichten gesendet.</p>
          )}
          {preview.messages.map((message) => (
            <Checkbox
              key={message.id}
              checked={messages.has(message.id)}
              onChange={(checked) => setMessages(toggle(messages, message.id, checked))}
            >
              <span className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">{message.label}</span>
                <span className="text-xs text-faint">
                  {MODULE_LABELS[message.module] ?? message.module} · #{message.channelName}
                </span>
                <a
                  href={message.jumpUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex items-center text-xs text-primary-hover hover:underline"
                >
                  ansehen
                  <ArrowUpRight className="size-3" />
                </a>
              </span>
            </Checkbox>
          ))}
        </CardBody>
      </Card>

      <Card className="border-danger/40">
        <CardBody className="space-y-4">
          <div className="flex gap-3 rounded-xl bg-danger-soft p-4 text-sm">
            <TriangleAlert className="size-5 shrink-0 text-danger" />
            <p>
              <span className="font-semibold text-danger">Das kann nicht rückgängig gemacht werden.</span>{" "}
              <span className="text-muted">Danach startet die Einrichtung des Servers von vorn.</span>
            </p>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-muted">
              Gib zur Bestätigung den Servernamen ein: <span className="text-text">{guildName}</span>
            </span>
            <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" />
          </label>
          <div className="flex justify-end">
            <Button variant="danger" onClick={submit} disabled={!confirmed || pending}>
              <RotateCcw />
              {pending ? "Wird zurückgesetzt…" : "Bot zurücksetzen"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
