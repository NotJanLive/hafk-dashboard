"use client";

import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  AtSign,
  CheckSquare,
  CircleDot,
  Hash,
  ListChecks,
  ListFilter,
  type LucideIcon,
  Paperclip,
  Plus,
  Shield,
  SquareCheck,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { Field, Input } from "@/components/ui/field";
import { SelectMenu } from "@/components/ui/select-menu";
import { Switch } from "@/components/ui/switch";
import type { FieldType, FormField, GuildEmoji } from "@/lib/bot-api/types";

export const MAX_FIELDS = 25;
const PER_PAGE = 5;

export const FIELD_TYPES: { value: FieldType; label: string; description: string; icon: LucideIcon }[] = [
  { value: "SHORT", label: "Kurzer Text", description: "Eine Zeile, z. B. Name oder Alter", icon: Type },
  {
    value: "PARAGRAPH",
    label: "Langer Text",
    description: "Mehrere Zeilen für ausführliche Antworten",
    icon: AlignLeft,
  },
  { value: "SELECT", label: "Auswahlmenü", description: "Dropdown mit bis zu 25 Optionen", icon: ListFilter },
  { value: "RADIO", label: "Einzelauswahl", description: "Radio-Buttons, genau eine Antwort", icon: CircleDot },
  { value: "CHECKBOXES", label: "Mehrfachauswahl", description: "Checkboxen, mehrere Antworten", icon: ListChecks },
  { value: "CHECKBOX", label: "Bestätigung", description: "Ein Haken, z. B. Regeln gelesen", icon: SquareCheck },
  { value: "USER", label: "Person", description: "Mitglied des Servers auswählen", icon: AtSign },
  { value: "ROLE", label: "Rolle", description: "Rolle des Servers auswählen", icon: Shield },
  { value: "CHANNEL", label: "Kanal", description: "Kanal des Servers auswählen", icon: Hash },
  { value: "FILE", label: "Datei-Upload", description: "Screenshots oder Dateien hochladen", icon: Paperclip },
];

const OPTION_TYPES: FieldType[] = ["SELECT", "RADIO", "CHECKBOXES"];
const MULTI_TYPES: FieldType[] = ["SELECT", "CHECKBOXES", "USER", "ROLE", "CHANNEL", "FILE"];
const PLACEHOLDER_TYPES: FieldType[] = ["SHORT", "PARAGRAPH", "SELECT", "USER", "ROLE", "CHANNEL"];

export function emptyField(type: FieldType): FormField {
  return {
    type,
    label: "",
    description: null,
    placeholder: null,
    required: type !== "CHECKBOX",
    minLength: null,
    maxLength: type === "SHORT" ? 100 : type === "PARAGRAPH" ? 1000 : null,
    minValues: null,
    maxValues: MULTI_TYPES.includes(type) ? 1 : null,
    options: OPTION_TYPES.includes(type)
      ? [
          { label: "", description: null, emoji: null },
          { label: "", description: null, emoji: null },
        ]
      : [],
  };
}

function maxOptions(type: FieldType) {
  return type === "SELECT" ? 25 : 10;
}

function numberOrNull(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : null;
}

function FieldEditor({
  field,
  index,
  total,
  emojis,
  guild,
  onChange,
  onMove,
  onRemove,
}: {
  field: FormField;
  index: number;
  total: number;
  emojis: GuildEmoji[];
  guild: { name: string; iconUrl: string | null };
  onChange: (field: FormField) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const type = FIELD_TYPES.find((candidate) => candidate.value === field.type) ?? FIELD_TYPES[0]!;
  const set = (patch: Partial<FormField>) => onChange({ ...field, ...patch });
  const usesOptions = OPTION_TYPES.includes(field.type);
  const isText = field.type === "SHORT" || field.type === "PARAGRAPH";
  const isMulti = MULTI_TYPES.includes(field.type);
  const valueLimit = field.type === "FILE" ? 10 : usesOptions ? Math.max(1, field.options.length) : 25;

  const changeType = (next: FieldType) => {
    const base = emptyField(next);
    onChange({
      ...base,
      label: field.label,
      description: field.description,
      required: next === "CHECKBOX" ? field.required : base.required,
      options:
        OPTION_TYPES.includes(next) && field.options.length > 0
          ? field.options.slice(0, maxOptions(next))
          : base.options,
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary-hover">
          <type.icon className="size-4" />
        </span>
        <p className="mr-auto text-sm font-bold">
          Frage {index + 1}
          <span className="ml-2 font-medium text-faint">{type.label}</span>
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          aria-label="Nach oben"
        >
          <ArrowUp />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          aria-label="Nach unten"
        >
          <ArrowDown />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label="Frage entfernen">
          <Trash2 />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Frage" count={field.label.length} max={45}>
          <Input
            value={field.label}
            onChange={(event) => set({ label: event.target.value })}
            maxLength={45}
            placeholder="z. B. Wie alt bist du?"
          />
        </Field>
        <Field label="Typ" custom>
          <SelectMenu
            value={field.type}
            onChange={(value) => changeType(value as FieldType)}
            options={FIELD_TYPES.map((candidate) => ({ value: candidate.value, label: candidate.label }))}
            ariaLabel="Typ"
          />
        </Field>
        <Field label="Beschreibung (optional)" count={field.description?.length ?? 0} max={100}>
          <Input
            value={field.description ?? ""}
            onChange={(event) => set({ description: event.target.value || null })}
            maxLength={100}
            placeholder="Kleiner Hinweis unter der Frage"
          />
        </Field>
        {PLACEHOLDER_TYPES.includes(field.type) && (
          <Field label="Platzhalter (optional)" count={field.placeholder?.length ?? 0} max={100}>
            <Input
              value={field.placeholder ?? ""}
              onChange={(event) => set({ placeholder: event.target.value || null })}
              maxLength={100}
            />
          </Field>
        )}
        {isText && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min. Zeichen">
              <Input
                type="number"
                min={0}
                max={4000}
                value={field.minLength ?? ""}
                onChange={(event) => set({ minLength: numberOrNull(event.target.value) })}
              />
            </Field>
            <Field label="Max. Zeichen">
              <Input
                type="number"
                min={1}
                max={4000}
                value={field.maxLength ?? ""}
                onChange={(event) => set({ maxLength: numberOrNull(event.target.value) })}
              />
            </Field>
          </div>
        )}
        {isMulti && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mindestens">
              <Input
                type="number"
                min={0}
                max={valueLimit}
                value={field.minValues ?? ""}
                onChange={(event) => set({ minValues: numberOrNull(event.target.value) })}
                placeholder={field.required ? "1" : "0"}
              />
            </Field>
            <Field label="Höchstens">
              <Input
                type="number"
                min={1}
                max={valueLimit}
                value={field.maxValues ?? ""}
                onChange={(event) => set({ maxValues: numberOrNull(event.target.value) })}
                placeholder="1"
              />
            </Field>
          </div>
        )}
      </div>

      {usesOptions && (
        <div className="mt-4 space-y-2">
          <p className="text-[13px] font-semibold text-muted">
            Auswahlmöglichkeiten ({field.options.length}/{maxOptions(field.type)})
          </p>
          {field.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex flex-wrap items-center gap-2">
              {field.type === "SELECT" && (
                <EmojiPicker
                  compact
                  value={option.emoji}
                  onChange={(emoji) =>
                    set({
                      options: field.options.map((current, i) => (i === optionIndex ? { ...current, emoji } : current)),
                    })
                  }
                  serverEmojis={emojis}
                  guild={guild}
                />
              )}
              <Input
                value={option.label}
                onChange={(event) =>
                  set({
                    options: field.options.map((current, i) =>
                      i === optionIndex ? { ...current, label: event.target.value } : current,
                    ),
                  })
                }
                maxLength={100}
                placeholder={`Option ${optionIndex + 1}`}
                className="min-w-40 flex-1"
              />
              <Input
                value={option.description ?? ""}
                onChange={(event) =>
                  set({
                    options: field.options.map((current, i) =>
                      i === optionIndex ? { ...current, description: event.target.value || null } : current,
                    ),
                  })
                }
                maxLength={100}
                placeholder="Beschreibung (optional)"
                className="min-w-40 flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => set({ options: field.options.filter((_, i) => i !== optionIndex) })}
                aria-label="Option entfernen"
              >
                <X />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={field.options.length >= maxOptions(field.type)}
            onClick={() => set({ options: [...field.options, { label: "", description: null, emoji: null }] })}
          >
            <Plus />
            Option hinzufügen
          </Button>
        </div>
      )}

      <div className="mt-3 -mx-3">
        <Switch
          checked={field.required}
          onChange={(required) => set({ required })}
          label={field.type === "CHECKBOX" ? "Muss angehakt werden" : "Pflichtfeld"}
        />
      </div>
    </div>
  );
}

export function FormBuilder({
  fields,
  onChange,
  emojis,
  guild,
}: {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
  emojis: GuildEmoji[];
  guild: { name: string; iconUrl: string | null };
}) {
  const pages = Math.ceil(fields.length / PER_PAGE);

  const move = (index: number, direction: -1 | 1) => {
    const next = [...fields];
    const target = index + direction;
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="rounded-xl border border-dashed border-border-strong px-4 py-6 text-center text-sm text-muted">
          Ohne Fragen öffnet sich das Ticket direkt. Mit Fragen füllt die Person zuerst ein Discord-Formular aus.
        </p>
      )}
      {fields.map((field, index) => (
        <div key={index}>
          {index > 0 && index % PER_PAGE === 0 && (
            <div className="my-4 flex items-center gap-3 text-xs font-bold tracking-wide text-faint uppercase">
              <span className="h-px flex-1 bg-border-strong" />
              Seite {index / PER_PAGE + 1} von {pages}
              <span className="h-px flex-1 bg-border-strong" />
            </div>
          )}
          <FieldEditor
            field={field}
            index={index}
            total={fields.length}
            emojis={emojis}
            guild={guild}
            onChange={(next) => onChange(fields.map((current, i) => (i === index ? next : current)))}
            onMove={(direction) => move(index, direction)}
            onRemove={() => onChange(fields.filter((_, i) => i !== index))}
          />
        </div>
      ))}
      {fields.length < MAX_FIELDS && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {FIELD_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange([...fields, emptyField(type.value)])}
              title={type.description}
              className="flex items-center gap-2 rounded-xl border border-dashed border-border-strong px-3 py-2.5 text-left text-sm font-semibold text-muted transition-colors hover:border-primary hover:bg-primary-soft hover:text-text"
            >
              <type.icon className="size-4 shrink-0" />
              <span className="truncate">{type.label}</span>
            </button>
          ))}
        </div>
      )}
      <p className="flex items-center gap-1.5 text-xs text-faint">
        <CheckSquare className="size-3.5" />
        Discord zeigt höchstens 5 Fragen pro Formular. Ab der 6. Frage wird automatisch eine weitere Seite angelegt
        (max. {MAX_FIELDS} Fragen).
      </p>
    </div>
  );
}
