"use client";

import { Eye, Lock, MessageSquareOff } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { createDiscordChannel } from "@/app/servers/[guildId]/actions";
import { Button } from "@/components/ui/button";
import { type Choice, ChoiceGrid } from "@/components/ui/choice-grid";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { RolePicker } from "@/components/ui/role-picker";
import { SelectMenu, type SelectMenuOption } from "@/components/ui/select-menu";
import type { Channel, Role } from "@/lib/bot-api/types";

const SENDABLE = new Set(["text", "news"]);
const CREATE = "__create__";

export type Visibility = "PUBLIC" | "READ_ONLY" | "PRIVATE";
export type CreateDefaults = { visibility: Visibility; roleIds?: string[]; hint?: string };

const VISIBILITY: Choice<Visibility>[] = [
  { value: "PUBLIC", label: "Öffentlich", description: "Alle können lesen und schreiben", icon: Eye },
  {
    value: "READ_ONLY",
    label: "Nur lesen",
    description: "Alle sehen ihn, nur der Bot schreibt",
    icon: MessageSquareOff,
  },
  { value: "PRIVATE", label: "Privat", description: "Nur ausgewählte Rollen und der Bot", icon: Lock },
];

type CreateInput = { name: string; parentId: string | null; visibility: Visibility; roleIds: string[] };

function useChannelCreation(channels: Channel[], type: "text" | "category", onCreated: (channelId: string) => void) {
  const params = useParams<{ guildId?: string }>();
  const router = useRouter();
  const [created, setCreated] = useState<Channel[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const guildId = params.guildId;
  const all = [...channels, ...created.filter((channel) => !channels.some((existing) => existing.id === channel.id))];

  const create = (input: CreateInput) => {
    if (!guildId) return;
    startTransition(async () => {
      const result = await createDiscordChannel(
        guildId,
        input.name,
        type,
        input.parentId,
        input.visibility,
        input.roleIds,
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setCreated((current) => [...current, result.channel]);
      onCreated(result.channel.id);
      setOpen(false);
      toast.success(
        type === "category" ? `Kategorie „${result.channel.name}“ erstellt.` : `#${result.channel.name} erstellt.`,
      );
      router.refresh();
    });
  };

  return { all, canCreate: Boolean(guildId), open, setOpen, pending, create };
}

function CreateDialog({
  open,
  onClose,
  type,
  categories,
  roles,
  defaults,
  pending,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  type: "text" | "category";
  categories: Channel[];
  roles?: Role[];
  defaults?: CreateDefaults;
  pending: boolean;
  onCreate: (input: CreateInput) => void;
}) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [visibility, setVisibility] = useState<Visibility>(defaults?.visibility ?? "PUBLIC");
  const [roleIds, setRoleIds] = useState<string[]>(defaults?.roleIds ?? []);
  const options = type === "category" ? VISIBILITY.filter((option) => option.value !== "READ_ONLY") : VISIBILITY;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim()) onCreate({ name: name.trim(), parentId: parentId || null, visibility, roleIds });
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={type === "category" ? "Neue Kategorie erstellen" : "Neuen Kanal erstellen"}
      description={
        defaults?.hint ?? "Der Bot legt ihn direkt in Discord an und setzt die Rechte passend zur Sichtbarkeit."
      }
    >
      <form onSubmit={submit}>
        <DialogBody className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" count={name.length} max={100}>
              <Input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                placeholder={type === "category" ? "z. B. Tickets" : "z. B. support"}
              />
            </Field>
            {type === "text" && (
              <Field label="In Kategorie" custom>
                <SelectMenu
                  value={parentId}
                  onChange={setParentId}
                  ariaLabel="Kategorie"
                  options={[
                    { value: "", label: "Ohne Kategorie" },
                    ...categories.map((category) => ({ value: category.id, label: category.name })),
                  ]}
                />
              </Field>
            )}
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-muted">Sichtbarkeit</p>
            <ChoiceGrid
              options={options}
              value={visibility}
              onChange={setVisibility}
              columns={options.length === 2 ? 2 : 3}
            />
          </div>
          {visibility === "PRIVATE" && roles && (
            <Field
              label="Zugriff für diese Rollen"
              hint="Admins sehen in Discord immer alles. Ohne Rollen sieht ihn nur der Bot."
              custom
            >
              <RolePicker name="channelRoleIds" roles={roles} defaultValue={roleIds} max={25} onChange={setRoleIds} />
            </Field>
          )}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={!name.trim() || pending}>
            {pending ? "Wird erstellt…" : "Erstellen"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export function ChannelSelect({
  channels,
  value,
  onChange,
  placeholder = "Kanal auswählen",
  roles,
  createDefaults,
}: {
  channels: Channel[];
  value: string;
  onChange: (channelId: string) => void;
  placeholder?: string;
  roles?: Role[];
  createDefaults?: CreateDefaults;
}) {
  const creation = useChannelCreation(channels, "text", onChange);
  const sorted = [...creation.all].sort((a, b) => a.position - b.position);
  const categories = sorted.filter((channel) => channel.type === "category");
  const sendable = sorted.filter((channel) => SENDABLE.has(channel.type));
  const toOption = (channel: Channel, group?: string): SelectMenuOption => ({
    value: channel.id,
    label: channel.name,
    prefix: "#",
    group,
  });
  const options = [
    ...(creation.canCreate ? [{ value: CREATE, label: "Neuen Kanal erstellen", prefix: "+" }] : []),
    ...sendable.filter((channel) => !channel.parentId).map((channel) => toOption(channel)),
    ...categories.flatMap((category) =>
      sendable.filter((channel) => channel.parentId === category.id).map((channel) => toOption(channel, category.name)),
    ),
  ];

  return (
    <>
      <SelectMenu
        value={value}
        onChange={(next) => (next === CREATE ? creation.setOpen(true) : onChange(next))}
        options={options}
        placeholder={placeholder}
        searchPlaceholder="Kanäle durchsuchen …"
        ariaLabel="Kanal"
      />
      <CreateDialog
        key={creation.open ? `open-${(createDefaults?.roleIds ?? []).join(",")}` : "closed"}
        open={creation.open}
        onClose={() => creation.setOpen(false)}
        type="text"
        categories={categories}
        roles={roles}
        defaults={createDefaults}
        pending={creation.pending}
        onCreate={creation.create}
      />
    </>
  );
}

export function CategorySelect({
  channels,
  value,
  onChange,
  noneLabel = "Keine Kategorie",
  roles,
  createDefaults,
}: {
  channels: Channel[];
  value: string;
  onChange: (categoryId: string) => void;
  noneLabel?: string;
  roles?: Role[];
  createDefaults?: CreateDefaults;
}) {
  const creation = useChannelCreation(channels, "category", onChange);
  const categories = creation.all
    .filter((channel) => channel.type === "category")
    .sort((a, b) => a.position - b.position);
  const options: SelectMenuOption[] = [
    ...(creation.canCreate ? [{ value: CREATE, label: "Neue Kategorie erstellen", prefix: "+" }] : []),
    { value: "", label: noneLabel },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ];

  return (
    <>
      <SelectMenu
        value={value}
        onChange={(next) => (next === CREATE ? creation.setOpen(true) : onChange(next))}
        options={options}
        searchPlaceholder="Kategorien durchsuchen …"
        ariaLabel="Discord-Kategorie"
      />
      <CreateDialog
        key={creation.open ? `open-${(createDefaults?.roleIds ?? []).join(",")}` : "closed"}
        open={creation.open}
        onClose={() => creation.setOpen(false)}
        type="category"
        categories={[]}
        roles={roles}
        defaults={createDefaults}
        pending={creation.pending}
        onCreate={creation.create}
      />
    </>
  );
}
