"use client";

import { X } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  description,
  size = "sm",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "lg";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "m-auto rounded-2xl border border-border-strong bg-surface p-0 text-text shadow-2xl shadow-black/60 backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        size === "sm" ? "w-[min(460px,calc(100vw-2rem))]" : "w-[min(720px,calc(100vw-2rem))]",
      )}
    >
      {open && (
        <>
          <div className="flex items-start justify-between gap-4 px-6 pt-5">
            <div>
              <h2 className="text-lg font-bold">{title}</h2>
              {description && <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1.5 rounded-lg p-1.5 text-faint transition-colors hover:bg-surface-2 hover:text-text"
              aria-label="Schließen"
            >
              <X className="size-5" />
            </button>
          </div>
          {children}
        </>
      )}
    </dialog>
  );
}

export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end gap-2 rounded-b-2xl border-t border-border bg-surface-2/50 px-6 py-4">
      {children}
    </div>
  );
}

function PromptForm({
  label,
  initialValue,
  placeholder,
  maxLength,
  confirmLabel,
  pending,
  onCancel,
  onSubmit,
}: {
  label: string;
  initialValue: string;
  placeholder?: string;
  maxLength?: number;
  confirmLabel: string;
  pending?: boolean;
  onCancel: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  };
  return (
    <form onSubmit={submit}>
      <DialogBody>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-muted">{label}</span>
          <Input
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
          />
        </label>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={!value.trim() || pending}>
          {pending ? "Bitte warten…" : confirmLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PromptDialog({
  open,
  onClose,
  title,
  description,
  label,
  initialValue = "",
  placeholder,
  maxLength,
  confirmLabel,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  maxLength?: number;
  confirmLabel: string;
  pending?: boolean;
  onSubmit: (value: string) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <PromptForm
        label={label}
        initialValue={initialValue}
        placeholder={placeholder}
        maxLength={maxLength}
        confirmLabel={confirmLabel}
        pending={pending}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </Dialog>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  danger = false,
  pending,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="h-5" />
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Abbrechen
        </Button>
        <Button type="button" variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={pending} autoFocus>
          {pending ? "Bitte warten…" : confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
